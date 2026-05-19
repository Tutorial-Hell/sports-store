import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "@/assets/styles/globals.css";
// import { cn } from "@/lib/utils";
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from "@/lib/constants"


const inter = Inter({subsets: ['latin']})

export const metadata: Metadata = {
  title: {
    template: `%s | Sportstore`,
    default: APP_NAME
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(SERVER_URL)
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // className={cn("h-full", "antialiased", inter.className, "font-sans", geist.variable)}
      
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
