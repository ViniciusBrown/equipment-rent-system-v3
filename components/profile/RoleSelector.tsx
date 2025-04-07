'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { UserRole } from '@/lib/auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle } from 'lucide-react'
import { env } from '@/lib/env'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'

export function RoleSelector() {
  const { user } = useAuth()
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Check if role selector should be enabled
  useEffect(() => {
    setIsEnabled(env.isRoleSelectorEnabled())
  }, [])

  const updateRole = async () => {
    if (!selectedRole || !user) return

    try {
      setIsUpdating(true)

      // Update the user's metadata
      const { error } = await supabase.auth.updateUser({
        data: { role: selectedRole }
      })

      if (error) throw error

      toast({
        title: 'Função atualizada',
        description: 'Sua função foi atualizada com sucesso. Você pode precisar fazer login novamente para que as alterações tenham efeito.',
      })

      // Force a page reload to update the session
      window.location.reload()
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: 'Erro ao atualizar função',
        description: 'Ocorreu um erro ao atualizar sua função. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (!user) return null

  // If role selector is disabled in production, show a message
  if (!isEnabled) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2 text-amber-500">
          <AlertTriangle className="h-5 w-5" />
          <p className="font-medium">Recurso desativado em produção</p>
        </div>
        <p className="text-sm text-muted-foreground">
          A alteração de funções está disponível apenas em ambiente de desenvolvimento ou para administradores do sistema.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Esta opção está disponível apenas para fins de teste. Em produção, apenas administradores podem alterar funções.
      </p>
      <div className="space-y-4">
        <Select onValueChange={(value) => setSelectedRole(value as UserRole)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione uma nova função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Cliente</SelectItem>
            <SelectItem value="equipment_inspector">Inspetor de Equipamentos</SelectItem>
            <SelectItem value="financial_inspector">Inspetor Financeiro</SelectItem>
            <SelectItem value="manager">Gerente</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={updateRole}
          disabled={!selectedRole || isUpdating}
          className="w-full"
        >
          {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Atualizar Função
        </Button>
      </div>
    </div>
  )
}
