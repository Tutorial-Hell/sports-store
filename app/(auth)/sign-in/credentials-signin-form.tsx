'use client'
import { Label } from "@/components/ui/label";
import {Input} from "@/components/ui/input"
import { signInDefaultValues } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { signInWithCredentials } from "@/lib/actions/user.actions";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

const SignInButton = () => {
    const {pending} = useFormStatus()
    return (
        <Button disabled={pending} className="w-full bg-black text-white hover:bg-black/90" variant='default'>
            {pending ? 'Signing In...' : 'Sign In'}
        </Button>
    )
}

const CredentialsSignInForm = () => {

    const [data, action] = useActionState(signInWithCredentials, {
        success: false,
        message: ''
    })

    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    return ( 
        <form action={action}>
            <input type="hidden" name="callbackUrl" value={callbackUrl} />
            <div className="space-y-6">
                <div>
                    <Label htmlFor="email" className="text-base">Email</Label>
                    <Input id="email"
                           name="email"
                           type="email"
                           required
                           autoComplete="email"
                           className="text-base"
                           defaultValue={signInDefaultValues.email}/>
                </div>
                <div>
                    <Label htmlFor="password" className="text-base">Password</Label>
                    <Input id="password"
                           name="password"
                           type="password"
                           required
                           autoComplete="password"
                           className="text-base"
                           defaultValue={signInDefaultValues.password}/>
                </div>
                <SignInButton />
            </div>
            {data && !data.success && (
                <div className="text-center text-destructive">{data.message}</div>
            )}
            <div className="text-sm text-center text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link href="/signup" target="_self" className='link'>
                    Sign up
                </Link>
            </div>
        </form>
     );
}
 
export default CredentialsSignInForm;