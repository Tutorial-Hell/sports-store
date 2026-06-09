'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader } from 'lucide-react'
import { toast } from 'sonner'
import { z } from 'zod'

import { paymentMethodSchema } from '@/lib/validators'
import { updateUserPaymentMethod } from '@/lib/actions/user.actions'
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'


type PaymentMethodForm = z.infer<typeof paymentMethodSchema>

const PaymentMethodForm = ({ preferredPaymentMethod }: { preferredPaymentMethod: string | null }) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const form = useForm<PaymentMethodForm>({
        resolver: zodResolver(paymentMethodSchema),
        defaultValues: {
            type: preferredPaymentMethod || DEFAULT_PAYMENT_METHOD,
        },
    })

    const onSubmit = (values: PaymentMethodForm) => {
        startTransition(async () => {
            const res = await updateUserPaymentMethod(values)
            if (!res.success) {
                toast.error(res.message)
                return
            }
            toast.success(res.message)
            router.push('/place-order')
        })
    }

    return (
        <>
            
            <div className="max-w-md mx-auto space-y-4">
                <h1 className="h2-bold">Payment Method</h1>
                <p className="text-muted-foreground text-sm">Please select your payment method</p>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Payment Method</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-2"
                                        >
                                            {PAYMENT_METHODS.map((method) => (
                                                <FormItem
                                                    key={method}
                                                    className="flex items-center space-x-3 space-y-0"
                                                >
                                                    <FormControl>
                                                        <RadioGroupItem value={method} />
                                                    </FormControl>
                                                    <FormLabel className="font-normal cursor-pointer">
                                                        {method}
                                                    </FormLabel>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isPending} className="w-full">
                            {isPending ? (
                                <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                                <ArrowRight className="w-4 h-4" />
                            )}
                            Continue
                        </Button>
                    </form>
                </Form>
            </div>
        </>
    )
}

export default PaymentMethodForm