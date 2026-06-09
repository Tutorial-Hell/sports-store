import { Metadata } from 'next'
import { auth } from '@/auth'
import { getUserById } from '@/lib/actions/user.actions'
import { getMyCart } from '@/lib/actions/cart.actions'
import { redirect } from 'next/navigation'
import PaymentMethodForm from './payment-method-form'
import CheckoutSteps from '@/components/shared/checkout-steps'

export const metadata: Metadata = {
    title: 'Select Payment Method',
}

const PaymentMethodPage = async () => {
    const cart = await getMyCart()
    if (!cart || cart.items.length === 0) redirect('/cart')

    const session = await auth()
    const userId = session?.user?.id
    if (!userId) throw new Error('User not found')

    const user = await getUserById(userId)

    return <>
        <CheckoutSteps current={2} />
        <PaymentMethodForm preferredPaymentMethod={user.paymentMethod} />
    </>
}

export default PaymentMethodPage