'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Loader } from 'lucide-react'
import { toast } from 'sonner'

import { ShippingAddress } from '@/types'
import { shippingAddressSchema } from '@/lib/validators'
import { updateUserAddress } from '@/lib/actions/user.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'

const ShippingAddressForm = ({ address }: { address: ShippingAddress | null }) => {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const form = useForm<ShippingAddress>({
        resolver: zodResolver(shippingAddressSchema),
        defaultValues: address ?? {
            fullName: '',
            streetAddress: '',
            city: '',
            postalCode: '',
            country: '',
        },
    })

    const onSubmit = (values: ShippingAddress) => {
        startTransition(async () => {
            const res = await updateUserAddress(values)
            if (!res.success) {
                toast.error(res.message)
                return
            }
            router.push('/payment-method')
        })
    }

    return (
        <div className="max-w-md mx-auto space-y-4">
            <h1 className="h2-bold">Shipping Address</h1>
            <p className="text-muted-foreground text-sm">Please enter your shipping address</p>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Full Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter full name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="streetAddress"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Street Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter street address" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>City</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter city" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Postal Code</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter postal code" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Country</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter country" {...field} />
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
    )
}

export default ShippingAddressForm
