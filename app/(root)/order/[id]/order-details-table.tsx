'use client'
import { Order } from "@/types";
import { formatId, formatDateTime, FormatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from 'next/link'
import Image from 'next/image'
import { PayPalButtons, PayPalScriptProvider, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { createPayPalOrder, 
         approvePayPalOrder,
         updateOrderToPaidCOD,
         deliverOrder
     } from "@/lib/actions/order.actions";
import { useTransition } from 'react'
import { toast } from "sonner";


const PrintLoadingState = () => {
    const [{isPending, isRejected}] = usePayPalScriptReducer()

    if(isPending) return <p>Loading PayPal...</p>
    if(isRejected) return <p>Error loading PayPal</p>
    return null
}

const MarkAsPaidButton = ({orderId}: {orderId: string}) => {
    const [isPending, startTransition] = useTransition()
    return (
        <Button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            const res = await updateOrderToPaidCOD(orderId)
            if(res?.success) {
                toast.success(res.message)
            } else {
                toast.error(res?.message)
            }
          })}
          variant="default">
            {isPending ? 'processing...' : 'Mark As Paid'}
        </Button>
    )
}

const MarkAsDeliveredButton = ({orderId}: {orderId: string}) => {
    const [isPending, startTransition] = useTransition()
    return (
        <Button
          type="button"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            const res = await deliverOrder(orderId)
            if(res?.success) {
                toast.success(res.message)
            } else {
                toast.error(res?.message)
            }
          })}
          variant="default">
            {isPending ? 'processing...' : 'Mark As Delivered'}
        </Button>
    )
}

const OrderDetailsTable = ({order, paypalClientId,isAdmin}:
    {order: Order, paypalClientId: string, isAdmin:boolean}) => {
    const {
        id,
        shippingAddress,
        orderitems,
        itemsPrice,
        shippingPrice,
        taxPrice,
        totalPrice,
        paymentMethod,
        isDelivered,
        isPaid,
        paidAt,
        deliveredAt,
    } = order

    const handleCreatePayPalOrder = async () => {
        const res = await createPayPalOrder(id)
        if(!res.success) {
            toast.error(res.message)
            throw new Error(res.message)
        }
        return res.data as string
    }

    const handleApprovePayPalOrder = async (data: {orderID: string}) => {
        const res = await approvePayPalOrder(id, data)
        if(res.success) {
            toast.success(res.message)
        } else {
            toast.error(res.message)
        }
    }

    return ( <>
        <h1 className="py-4 text-2xl">Order {formatId(id)}</h1>
        <div className="grid md:grid-cols-3 md:gap-5">
            <div className="cols-span-2 space-4-y overlfow-x-auto">
                <Card>
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Payment Method</h2>
                        <p className="mb-2">{paymentMethod}</p>
                {isPaid ? (
                    <Badge variant="secondary">
                    Paid at {formatDateTime(paidAt!).dateTime}
                    </Badge>
                ) : (<Badge variant="destructive">
                    Not Paid
                </Badge>)}
                    </CardContent>
                </Card>
                <Card className="my-2">
                    <CardContent className="p-4 gap-4">
                        <h2 className="text-xl pb-4">Shipping Address</h2>
                        <p>{shippingAddress.fullName}</p>
                        <p className="mb-2">
                            {shippingAddress.streetAddress}, {shippingAddress.city}
                            {shippingAddress.postalCode}, {shippingAddress.country}
                        </p>

                {isDelivered ? (
                    <Badge variant="secondary">
                    Delivered on {formatDateTime(deliveredAt!).dateTime}
                    </Badge>
                ) : (<Badge variant="destructive">
                    Not Delivered
                </Badge>)}
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 gap-4">
                    <h2 className="text-xl pb-4">Order Items</h2>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Price</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orderitems.map((item) => (
                                <TableRow key={item.productId}>
                                    <TableCell>
                                        <Link href={`/product/${item.slug}`} className="flex items-center">
                                          <Image src={item.image}
                                                 alt={item.name}
                                                 height={50}
                                                 width={50}/>
                                            <span className="px-2">{item.name}</span>
                                        </Link>
                                    </TableCell>

                                    <TableCell>
                                        <span className="px-2">{item.qty}</span>
                                    </TableCell>

                                    <TableCell className="text-right">
                                        {FormatCurrency(item.price)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
            </div>
             <div>
            <Card>
                <CardContent className="p-4 gap-4 space-y-4">
                            <div className="flex justify-between">
                                <div>Items</div>
                                <div>{ FormatCurrency(itemsPrice)}</div>
                            </div>
                            <div className="flex justify-between">
                                <div>Tax</div>
                                <div>{ FormatCurrency(taxPrice)}</div>
                            </div>
                            <div className="flex justify-between">
                                <div>Shipping</div>
                                <div>{ FormatCurrency(shippingPrice)}</div>
                            </div>
                            <div className="flex justify-between">
                                <div>Total</div>
                                <div>{ FormatCurrency(totalPrice)}</div>
                            </div>

                            {paymentMethod === 'PayPal' && !isPaid && (
                                <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                                    <PrintLoadingState />
                                    <PayPalButtons
                                        createOrder={handleCreatePayPalOrder}
                                        onApprove={handleApprovePayPalOrder}
                                    />
                                </PayPalScriptProvider>
                            )}
                            {/* Cash On Delivery */}
                            {isAdmin && !isPaid && paymentMethod == 'CashOnDelivery' && (
                                <MarkAsPaidButton orderId={id}/>
                            )}
                            {isAdmin && isPaid && !isDelivered && (
                                <MarkAsDeliveredButton orderId={id}/>
                            )}
                </CardContent>
            </Card>
        </div>
        </div>


    </> );
}
 
export default OrderDetailsTable;