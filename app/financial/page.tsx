'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Loader2 } from 'lucide-react'

export default function FinancialPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Check if user has the required role
  useEffect(() => {
    if (!loading && user) {
      const hasAccess = ['financial_inspector', 'manager'].includes(user.role)
      if (!hasAccess) {
        router.push('/unauthorized')
      }
    } else if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-6 w-6" />
            <CardTitle className="text-2xl">Gestão Financeira</CardTitle>
          </div>
          <CardDescription>
            Gerencie aspectos financeiros dos pedidos de aluguel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Página em Desenvolvimento</h3>
            <p className="text-muted-foreground">
              Esta funcionalidade estará disponível em breve. Aqui você poderá aprovar orçamentos,
              gerenciar pagamentos e gerar contratos para os pedidos de aluguel.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
