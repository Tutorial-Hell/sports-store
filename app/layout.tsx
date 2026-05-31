import type { Metadata } from "next";
import "@/assets/styles/globals.css";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/constants"
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={`${inter.className} min-h-full flex flex-col`}>
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
