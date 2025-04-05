'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { useAuth } from '@/hooks/use-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { RentalRequest } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { translateStatus, getStatusColor } from '@/components/rent-orders/utils'
import Link from 'next/link'

export default function MyOrdersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [orders, setOrders] = useState<RentalRequest[]>([])
  const { user } = useAuth()

  useEffect(() => {
    async function fetchOrders() {
      if (!user) return

      try {
        const supabase = createClientComponentClient()
        const { data, error } = await supabase
          .from('rental_requests')
          .select('*')
          .eq('email', user.email)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching orders:', error)
          return
        }

        setOrders(data as RentalRequest[])
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [user])

  if (!user || isLoading) {
    return (
      <div className="py-10">
        <div className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="py-10">
      <div className="space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold">Meus Pedidos</h1>
          <p className="text-muted-foreground">
            Acompanhe o status dos seus pedidos de aluguel
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="border rounded-lg p-10 text-center">
            <h2 className="text-lg font-medium mb-2">Nenhum pedido encontrado</h2>
            <p className="text-muted-foreground mb-4">
              Você ainda não fez nenhum pedido de aluguel.
            </p>
            <Button asChild>
              <Link href="/">Fazer um pedido</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Pedido #{order.reference_number}</CardTitle>
                      <CardDescription>
                        {new Date(order.created_at!).toLocaleDateString('pt-BR')}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(order.status as any)}>
                      {translateStatus(order.status as any)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium">Período de Aluguel</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.rental_start).toLocaleDateString('pt-BR')} até{' '}
                        {new Date(order.rental_end).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Equipamentos</p>
                      <p className="text-sm text-muted-foreground">
                        {order.equipment_items.length} itens
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Valor Total</p>
                      <p className="text-sm font-bold">
                        R$ {order.estimated_cost.toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href={`/orders/${order.id}`}>Ver Detalhes</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
