import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"
import { ThemeProvider } from "@/components/ThemeProvider"

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
      <body className={`${inter.className} [perspective:2500px] [transform-style:preserve-3d] [backface-visibility:hidden]`}>
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
                <Link href="/tables" className="text-sm font-medium">
                  Tables
                </Link>
                <ThemeToggle />
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
