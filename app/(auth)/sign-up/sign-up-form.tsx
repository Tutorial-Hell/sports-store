'use client'
import { Label } from "@/components/ui/label";
import {Input} from "@/components/ui/input"
import { signUpDefaultValues } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signUpUser} from "@/lib/actions/user.actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

const SignUpButton = () => {
    const {pending} = useFormStatus()
    return (
        <Button disabled={pending} className="w-full bg-black text-white hover:bg-black/90" variant='default'>
            {pending ? 'Submitting...' : 'Sign Up'}
        </Button>
    )
}

const SignUpForm = () => {

    const [data, action] = useActionState(signUpUser, {
        success: false,
        message: ''
    })

    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    return ( 
        <form action={action}>
            <input type="hidden" name="callbackUrl" value="callbackUrl" />
            <div className="space-y-6">
                <div>
                    <Label htmlFor="name" className="text-base">Name</Label>
                    <Input id="name"
                           name="name"
                           type="text"
                           required
                           autoComplete="name"
                           className="text-base"
                           defaultValue={signUpDefaultValues.email}/>
                </div>
                <div>
                    <Label htmlFor="email" className="text-base">Email</Label>
                    <Input id="email"
                           name="email"
                           type="email"
                           required
                           autoComplete="email"
                           className="text-base"
                           defaultValue={signUpDefaultValues.email}/>
                </div>
                <div>
                    <Label htmlFor="password" className="text-base">Password</Label>
                    <Input id="password"
                           name="password"
                           type="password"
                           required
                           autoComplete="password"
                           className="text-base"
                           defaultValue={signUpDefaultValues.password}/>
                </div>
                <div>
                    <Label htmlFor="confirmPassword" className="text-base">Confirm Password</Label>
                    <Input id="confirmPassword"
                           name="confirmPassword"
                           type="password"
                           required
                           autoComplete="confirmPassword"
                           className="text-base"
                           defaultValue={signUpDefaultValues.confirmPassword}/>
                </div>
                <SignUpButton />
            </div>
            {data && !data.success && (
                <div className="text-center text-destructive">{data.message}</div>
            )}
            <div className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link href="/signup" target="_self" className='link'>
                    Sign in
                </Link>
            </div>
        </form>
     );
}
 
export default SignUpForm;