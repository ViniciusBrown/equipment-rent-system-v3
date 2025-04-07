'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/lib/auth'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Loader2, ShieldAlert, Users } from 'lucide-react'

type User = {
  id: string
  email: string
  role: UserRole
  name?: string
  created_at: string
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Check if the current user is a manager
  useEffect(() => {
    if (user && user.role !== 'manager') {
      router.push('/unauthorized')
    }
  }, [user, router])

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)

        // First, try to use the users_view (which is restricted to managers)
        let { data, error } = await supabase.from('users_view').select('*')

        // If there's an error with the view, we'll try a direct approach
        if (error) {
          console.warn('Could not access users_view, trying direct approach:', error)

          // This is a fallback for when the view isn't set up correctly
          // It will only work if the user is a manager and has the service_role key
          const { data: adminData, error: adminError } = await supabase.rpc('admin_get_users')

          if (adminError) {
            throw adminError
          }

          data = adminData
        }

        setUsers(data || [])
      } catch (error) {
        console.error('Error fetching users:', error)
        toast({
          title: 'Erro ao carregar usuários',
          description: 'Não foi possível carregar a lista de usuários. Verifique se você tem permissões de administrador.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    if (user && user.role === 'manager') {
      fetchUsers()
    }
  }, [user, supabase, toast])

  // Update user role
  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setUpdatingUserId(userId)

      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          role: newRole,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user role')
      }

      // Update the local state
      setUsers(users.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ))

      toast({
        title: 'Função atualizada',
        description: 'A função do usuário foi atualizada com sucesso.',
      })
    } catch (error) {
      console.error('Error updating user role:', error)
      toast({
        title: 'Erro ao atualizar função',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao atualizar a função do usuário.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (!user || user.role !== 'manager') {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <CardTitle className="text-2xl">Gerenciamento de Usuários</CardTitle>
          </div>
          <CardDescription>
            Gerencie os usuários e suas funções no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              Nenhum usuário encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          user.role === 'manager'
                            ? 'bg-red-500'
                            : user.role === 'financial_inspector'
                            ? 'bg-amber-500'
                            : user.role === 'equipment_inspector'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`} />
                        <span>
                          {user.role === 'manager'
                            ? 'Gerente'
                            : user.role === 'financial_inspector'
                            ? 'Inspetor Financeiro'
                            : user.role === 'equipment_inspector'
                            ? 'Inspetor de Equipamentos'
                            : 'Cliente'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Select
                        defaultValue={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value as UserRole)}
                        disabled={updatingUserId === user.id}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Selecionar função" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Cliente</SelectItem>
                          <SelectItem value="equipment_inspector">Inspetor de Equipamentos</SelectItem>
                          <SelectItem value="financial_inspector">Inspetor Financeiro</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
