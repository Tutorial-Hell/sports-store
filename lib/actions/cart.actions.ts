'use server'
import { cookies } from "next/headers"
import { CartItem } from "@/types"
import { formatError, round2 } from "../utils"
import { auth } from "@/auth"
import { prisma } from '@/db/prisma'
import { convertToPlainObject } from "../utils"
import { cartItemSchema, insertCartSchema } from "../validators"
import { revalidatePath } from "next/cache"
import { Prisma } from "../generated/prisma/client"

const calcPrice = (items: CartItem[]) => {
    const itemsPrice = round2(
        items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
    ),
    shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
    taxPrice = round2(0.15 * itemsPrice),
    totalPrice = round2(itemsPrice + shippingPrice + taxPrice)

    return {
        itemsPrice: itemsPrice.toFixed(2),
        shippingPrice: shippingPrice.toFixed(2),
        taxPrice: taxPrice.toFixed(2),
        totalPrice: totalPrice.toFixed(2),
    }
    
}

export async function addItemToCart(data: CartItem) {
    try {
        // Check for cart cookie
        const sessionCartId = (await cookies()).get('sessionCartId')?.value
        if (!sessionCartId) throw new Error('Cart session not found')

        // Get session and user id
        const session = await auth()
        const userID = session?.user?.id ? (session.user.id as string) : undefined

        // Get Cart
        const cart = await getMyCart()

        // Parse and validate item
        const item = cartItemSchema.parse(data)

        // Find product in DB
        const product = await prisma.product.findFirst({
            where: { id: item.productId }
        })

        if (!product) throw new Error('Product not found')

        if (!cart) {
            const newCart = insertCartSchema.parse({
                userId: userID,
                items: [item],
                sessionCartId: sessionCartId,
                ...calcPrice([item])
            })
            await prisma.cart.create({ data: newCart })
            revalidatePath(`/product/${product.slug}`)
            return { success: true, message: `${item.name} added to cart` }
        } else {
            const existItem = (cart.items as CartItem[]).find((x) => x.productId === item.productId)

            const cartItems = cart.items as CartItem[]

            if (existItem) {
                if (product.stock < existItem.qty + 1) throw new Error('Not enough stock')
                cartItems.find((x: CartItem) => x.productId === item.productId)!.qty = existItem.qty + 1
            } else {
                if (product.stock < 1) throw new Error('Not enough stock')
                cartItems.push(item)
            }

            await prisma.cart.update({
                where: { id: cart.id },
                data: {
                    items: cartItems as Prisma.InputJsonValue[],
                    ...calcPrice(cartItems)
                }
            })
            revalidatePath(`/product/${product.slug}`)

            return {
                success: true,
                message: `${product.name} ${existItem ? 'updated in' : 'added to'} cart`
            }
        }
    } catch (error) {
        return { success: false, message: formatError(error) }
    }
}

export async function getMyCart () {
    const sessionCartId = (await cookies()).get('sessionCartId')?.value
        if(!sessionCartId) throw new Error('Cart session not found')

    const session = await auth()
    const userID = session?.user?.id ? (session.user.id as string) : undefined

    // Get user cart from DB
    const cart = await prisma.cart.findFirst({
        where: userID ? {userId: userID} : {sessionCartId: sessionCartId}
    })

    if(!cart) return undefined

    //Convert Decimal and return
    return convertToPlainObject({
        ...cart,
        items: cart.items as CartItem[],
        itemsPrice: cart.itemsPrice.toString(),
        totalPrice: cart.totalPrice.toString(),
        shippingPrice: cart.shippingPrice.toString(),
        taxPrice: cart.taxPrice.toString()
    })
}


export async function removeItemFromCart(productId: string) {
    try {
        const sessionCartId = (await cookies()).get('sessionCartId')?.value
        if(!sessionCartId) throw new Error('Cart session not found')

        // get product
        const product = await prisma.product.findFirst({
            where: {id: productId}
        })

        if(!product) throw new Error('Product not found')

        // Get user Cart
        const cart = await getMyCart()
        if(!cart) throw new Error('Cart not found')

        // Check for item
        const cartItems = cart.items as CartItem[]
        const exist = cartItems.find((x: CartItem) => x.productId === productId)
        if(!exist) throw new Error('Item not found')

        // Check if only one item in cart or more
        if(exist.qty === 1) {
            cart.items = cartItems.filter((x: CartItem) => x.productId !== exist.productId)
        } else {
            // Decrease quantity
            cartItems.find((x: CartItem) => x.productId === productId)!.qty = exist.qty - 1
        }

        // Update cart in db
        await prisma.cart.update({
            where: {id: cart.id},
            data: {
                items: cart.items as Prisma.InputJsonValue[],
                ...calcPrice(cart.items as CartItem[])
            }
        })
    revalidatePath(`/product/${product.slug}`)

    return {
        success: true,
        message: `${product.name} removed from cart`
    }

    } catch (error) {
        return {success: false,
                message: formatError(error)
        }
    }
}