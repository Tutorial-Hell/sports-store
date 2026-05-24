import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "@/assets/styles/globals.css";
// import { cn } from "@/lib/utils";
import { APP_DESCRIPTION, APP_NAME, SERVER_URL } from "@/lib/constants"
import { ThemeProvider } from "next-themes";


const inter = Inter({subsets: ['latin']})

const metadataBaseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001');

export const metadata: Metadata = {
  title: {
    template: `%s | Sportstore`,
    default: APP_NAME
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(metadataBaseUrl),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute='class'
          defaultTheme='light'
          enableSystem
          disableTransitionOnChange>
           {children}
        </ThemeProvider>
        </body>
    </html>
  );
}
