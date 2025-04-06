'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
  const router = useRouter()

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md border shadow-lg">
        <CardHeader className="space-y-1 text-center bg-primary/5 border-b pb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-4 ring-2 ring-destructive/20">
              <ShieldAlert className="h-6 w-6 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Acesso Negado</CardTitle>
          <CardDescription>
            Você não tem permissão para acessar esta página
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 text-center">
          <p className="mb-4">
            Seu perfil de usuário não possui as permissões necessárias para acessar o recurso solicitado.
          </p>
          <p className="text-sm text-muted-foreground">
            Se você acredita que deveria ter acesso a esta página, entre em contato com o administrador do sistema.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center space-x-4 bg-muted/30 border-t py-6">
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
          <Button asChild>
            <Link href="/">Ir para a Página Inicial</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
