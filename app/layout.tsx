import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Sistema de Aluguel de Equipamentos",
  description: "Gerencie aluguéis de equipamentos para produção de filmes e vídeos",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} [perspective:2500px] [transform-style:preserve-3d] [backface-visibility:hidden]`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <header className="border-b">
            <div className="container flex h-16 items-center justify-between">
              <Link href="/" className="font-bold text-xl">
                Aluguel de Equipamentos
              </Link>
              <nav className="flex items-center gap-6">
                <ThemeToggle />
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'
