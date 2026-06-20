import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: 'Unauthorized Access'
}

const Unauthorized = () => {
    return (
       <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
            <h1 className="h1-bold text-4xl">Unauthorized Access </h1>
            <p className="text-muted-foreground">
                You do not have permission to access this page.
            </p>
            <Button asChild>
                <Link href="/">Return Home</Link>
            </Button>
        </div>

    )
}


export default Unauthorized