'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogIn, LogOut, UserPlus, User, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export function AuthNav() {
  const { user, signOut, loading } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    await signOut()
    toast({
      title: 'Desconectado',
      description: 'Você foi desconectado com sucesso.',
    })
    router.push('/')
  }

  if (loading) {
    return null
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/login">
            <LogIn className="mr-2 h-4 w-4" />
            Entrar
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/register">
            <UserPlus className="mr-2 h-4 w-4" />
            Cadastrar
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          {user.role !== 'client' ? (
            <Shield className="h-4 w-4 text-primary" />
          ) : (
            <User className="h-4 w-4" />
          )}
          <span className="hidden md:inline">
            {user.metadata.name || user.email}
            {user.role !== 'client' && (
              <span className="ml-1 text-muted-foreground">
                ({user.role === 'manager' ? 'Gerente' :
                  user.role === 'equipment_inspector' ? 'Inspetor de Equipamentos' :
                  user.role === 'financial_inspector' ? 'Inspetor Financeiro' :
                  user.role})
              </span>
            )}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          Minha Conta
          {user.role !== 'client' && (
            <span className="block text-xs font-normal text-muted-foreground mt-1">
              {user.role === 'manager' ? 'Gerente' :
               user.role === 'equipment_inspector' ? 'Inspetor de Equipamentos' :
               user.role === 'financial_inspector' ? 'Inspetor Financeiro' :
               user.role}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">Perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/my-orders">Meus Pedidos</Link>
        </DropdownMenuItem>
        {/* Role-specific menu items */}
        {user.role !== 'client' && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Área Administrativa
            </DropdownMenuLabel>

            {/* Manager-specific items */}
            {user.role === 'manager' && (
              <DropdownMenuItem asChild>
                <Link href="/admin/users">Gerenciar Usuários</Link>
              </DropdownMenuItem>
            )}

            {/* Equipment inspector items */}
            {(user.role === 'equipment_inspector' || user.role === 'manager') && (
              <DropdownMenuItem asChild>
                <Link href="/inspections">Inspeções de Equipamentos</Link>
              </DropdownMenuItem>
            )}

            {/* Financial inspector items */}
            {(user.role === 'financial_inspector' || user.role === 'manager') && (
              <DropdownMenuItem asChild>
                <Link href="/financial">Gestão Financeira</Link>
              </DropdownMenuItem>
            )}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
