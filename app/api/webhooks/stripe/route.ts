import {NextRequest, NextResponse} from "next/server"
import Stripe from 'stripe'
import { updateOrderToPaid } from "@/lib/actions/order.actions"
import { formatError } from "@/lib/utils"

export async function POST(req: NextRequest) {
    let event: Stripe.Event
    try {
        event = await Stripe.webhooks.constructEvent(
            await req.text(),
            req.headers.get('stripe-signature') as string,
            process.env.STRIPE_WEBHOOK_SECRET as string
        )
    } catch (error) {
        return NextResponse.json({ message: formatError(error) }, { status: 400 })
    }

    // Check for successful payment
    if(event.type ==='charge.succeeded') {
        const {object} = event.data

        if(!object.metadata.orderId) {
            return NextResponse.json({ message: 'Missing orderId in charge metadata' }, { status: 400 })
        }

        try {
            //Update order status
            await updateOrderToPaid({
                orderId: object.metadata.orderId,
                paymentResult: {
                    id: object.id,
                    status: 'COMPLETED',
                    email_address: object.billing_details.email!,
                    pricePaid: (object.amount /100).toFixed(2)
                }
            })
            return NextResponse.json({
                message: 'updateOrderToPaid was successful'
            })
        } catch (error) {
            return NextResponse.json({ message: formatError(error) }, { status: 400 })
        }
    }
    return NextResponse.json({
        message: 'Event is not charge.succeeded'
    })
}