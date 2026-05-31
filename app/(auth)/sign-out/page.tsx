import Image from "next/image";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: "Sign Out" };

export default function SignOutPage() {
  return (
    <div className="text-center flex flex-col items-center gap-4">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/images/logo.svg"
          alt={`${APP_NAME} logo`}
          height={48}
          width={48}
          priority
        />
        <span className="font-bold text-2xl">{APP_NAME}</span>
      </Link>
      <h1 className="text-2xl font-bold">Sign Out</h1>
    </div>
  );
}
