import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"
import { ThemeProvider } from "@/components/ThemeProvider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/lib/auth"
import { AuthNav } from "@/components/AuthNav"
import { Code2 } from "lucide-react"

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
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <div className="flex flex-col min-h-screen mx-auto w-full px-4 sm:px-6 lg:px-8">
              <header className="border-b py-2 sticky top-0 bg-background z-50">
                <div className="flex h-16 items-center justify-between">
                  <Link href="/" className="font-bold text-xl hover:text-primary transition-colors">
                    Aluguel de Equipamentos
                  </Link>
                  <nav className="flex items-center gap-6">
                    <AuthNav />
                    <ThemeToggle />
                  </nav>
                </div>
              </header>
              <main className="flex-grow py-4 overflow-x-hidden">{children}</main>
              <footer className="border-t py-4 mt-auto">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Sistema de Aluguel de Equipamentos
                  </p>
                  <div className="flex items-center gap-4">
                    <Link
                      href="https://github.com/ViniciusBrown/equipment-rent-system-v3"
                      target="_blank"
                      className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-2"
                    >
                      <Code2 className="h-4 w-4" />
                      GitHub
                    </Link>
                  </div>
                </div>
              </footer>
            </div>
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
