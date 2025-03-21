import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Equipment Rental System",
  description: "Manage equipment rentals for film and video production",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="border-b">
            <div className="container flex h-16 items-center justify-between">
              <Link href="/" className="font-bold text-xl">
                Equipment Rental
              </Link>
              <nav className="flex items-center gap-6">
                <Link href="/" className="text-sm font-medium">
                  Rent Orders
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'
