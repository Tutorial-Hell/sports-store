'use server'
import { isRedirectError} from "next/dist/client/components/redirect-error"
import { convertToPlainObject, formatError} from "../utils"
import { auth } from "@/auth"
import { getMyCart } from "./cart.actions"
import { getUserById } from "./user.actions"
import { insertOrderSchema } from "../validators"
import { prisma } from '@/db/prisma'
import { CartItem, Order, PaymentResult } from "@/types"
import { paypal } from "../paypal"
import { revalidatePath } from "next/cache"
import { PAGE_SIZE } from "../constants"
import { string } from "zod"
import { Prisma } from "@/lib/generated/prisma"

// Action to create order and order items
export async function createOrder() {
    try {
        const session = await auth()
        if(!session) throw new Error('User is not authenticated')

        const cart = await getMyCart()
        const userId = session?.user?.id
        if(!userId) throw new Error('User not found')

        const user = await getUserById(userId)

        if(!cart || cart.items.length === 0) {
            return {success: false, message: "Your cart is empty", redirectTo: "/cart"}
        }


        if(!user.address) {
            return {success: false, message: "No address provided", redirectTo: "/shipping-address"}
        }

        if(!user.paymentMethod) {
            return {success: false, message: "Provide Payment Method", redirectTo: "/payment-method"}
        }

        // Create order object
        const order = insertOrderSchema.parse({
            userId: user.id,
            shippingAddress: user.address,
            paymentMethod: user.paymentMethod,
            itemsPrice: cart.itemsPrice,
            shippingPrice: cart.shippingPrice,
            taxPrice: cart.taxPrice,
            totalPrice: cart.totalPrice,
        })

        // Create a transaction to create order order items in db
        const insertedOrderId = await prisma.$transaction(async (tx) => {
            // Create order
            const insertedOrder = await tx.order.create({data: order})

            // Create order items from cart items
            for(const item of cart.items as CartItem[]) {
                await tx.orderItem.create({
                    data: {
                        ...item,
                        price: item.price,
                        orderId: insertedOrder.id
                    }
                })
            }

            // Clear Cart
            await tx.cart.update({
                where: {id: cart.id},
                data: {
                    items: [],
                    totalPrice: 0,
                    taxPrice: 0,
                    shippingPrice: 0,
                    itemsPrice: 0,
                }
            })
            return insertedOrder.id
        })
        if(!insertedOrderId) throw new Error('Order not created')

            return {success: true, message:"Order Created", redirectTo: `/order/${insertedOrderId}`}
    } catch (error) {
        if(isRedirectError(error)) throw error
        return {success: false, message: formatError(error)}
    }
}

// Get order by id
export  async function getOrderById(orderId: string) {
    const session = await auth()
    if(!session?.user?.id) return null

    const isAdmin = (session.user as {role?: string}).role === 'admin'

    const data = await prisma.order.findFirst({
        where: {
            id: orderId,
            ...(isAdmin ? {} : { userId: session.user.id }),
        },
        include: {orderitems: true,
        user: {select: {name: true, email: true}},
     }
    })
    return convertToPlainObject(data) as Order | null
}

// Create a new PayPal order for an existing order
export async function createPayPalOrder(orderId: string) {
    try {
        const session = await auth()
        if(!session?.user?.id) throw new Error('User is not authenticated')

        const order = await prisma.order.findFirst({
            where: {id: orderId, userId: session.user.id}
        })

        if(!order) throw new Error('Order not found')

        const paypalOrder = await paypal.createOrder(Number(order.totalPrice))

        await prisma.order.update({
            where: {id: orderId},
            data: {
                paymentResult: {
                    id: paypalOrder.id,
                    email_address: '',
                    status: '',
                    pricePaid: '0',
                }
            }
        })

        return {success: true, message: 'PayPal order created successfully', data: paypalOrder.id}
    } catch (error) {
        return {success: false, message: formatError(error)}
    }
}

// Approve PayPal order and mark order as paid
export async function approvePayPalOrder(orderId: string, data: {orderID: string}) {
    try {
        const session = await auth()
        if(!session?.user?.id) throw new Error('User is not authenticated')

        const order = await prisma.order.findFirst({
            where: {id: orderId, userId: session.user.id}
        })

        if(!order) throw new Error('Order not found')

        const captureData = await paypal.capturePayment(data.orderID)

        if(!captureData || captureData.id !== (order.paymentResult as PaymentResult)?.id || captureData.status !== 'COMPLETED') {
            throw new Error('Error in PayPal payment')
        }

        await updateOrderToPaid({
            orderId,
            paymentResult: {
                id: captureData.id,
                status: captureData.status,
                email_address: captureData.payer.email_address,
                pricePaid: captureData.purchase_units[0]?.payments?.captures[0]?.amount?.value,
            }
        })

        revalidatePath(`/order/${orderId}`)

        return {success: true, message: 'Your order has been paid'}
    } catch (error) {
        return {success: false, message: formatError(error)}
    }
}

// Update order to paid in the database
async function updateOrderToPaid({orderId, paymentResult}: {orderId: string, paymentResult: PaymentResult}) {
    const order = await prisma.order.findFirst({
        where: {id: orderId}
    })

    if(!order) throw new Error('Order not found')
    if(order.isPaid) throw new Error('Order is already paid')

    await prisma.order.update({
        where: {id: orderId},
        data: {
            isPaid: true,
            paidAt: new Date(),
            paymentResult,
        }
    })
}

// Get User's Orders
export async function getMyOrders({
    limit= PAGE_SIZE,
    page
}: {limit?: number; page: number}) {
    const session = await auth()

    if(!session?.user?.id) throw new Error('User is not authorized')

    const data = await prisma.order.findMany({
        where: {userId: session.user.id},
        orderBy: {createdAt: 'desc'},
        take: limit,
        skip: (page-1) * limit
    })

    const dataCount = await prisma.order.count({
        where: {userId: session.user.id}
    })

    return {
        data,
        totalPages: Math.ceil(dataCount/limit)
    }
}

type SalesDataType = {
    month: string;
    totalSales: number;
}[]

// Get sales data and order summary
export async function getOrderSummary() {

    // Get counts for each resource
    const ordersCount = await prisma.order.count()
    const productsCount = await prisma.product.count()
    const usersCount = await prisma.user.count()

    // Calculate total sales
    const totalSales = await prisma.order.aggregate({
        _sum: {totalPrice: true}
    })

    // Get monthly sales
    const salesDataRaw = await prisma.$queryRaw<Array<{month: string; totalSales: Prisma.Decimal}>>
    `SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM
    "Order" GROUP BY to_char("createdAt", 'MM/YY')`

    const salesData:SalesDataType = salesDataRaw.map((entry) => ({
        month: entry.month,
        totalSales: Number(entry.totalSales)
    }))

    // Get latest sales
    const latestSales = await prisma.order.findMany({
        orderBy: {
           createdAt: 'desc' 
        },
        include: {
            user: {select: {name: true}}
        },
        take: 6,
    })
    return {
        ordersCount,
        productsCount,
        usersCount,
        totalSales,
        latestSales,
        salesData
    }
}