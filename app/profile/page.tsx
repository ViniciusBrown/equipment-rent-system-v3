'use client'

import { useState, useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { RoleSelector } from '@/components/profile/RoleSelector'
import { env } from '@/lib/env'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { createClient } from '@/utils/supabase/client'

// Form schema with validation
const formSchema = z.object({
  name: z.string().min(3, {
    message: 'O nome deve ter pelo menos 3 caracteres.',
  }),
  email: z.string().email({
    message: 'Por favor, insira um endereço de e-mail válido.',
  }).optional(),
  phone: z.string().min(10, {
    message: 'Por favor, insira um número de telefone válido.',
  }).optional(),
})

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showRoleSelector, setShowRoleSelector] = useState(false)
  const { toast } = useToast()
  const { user } = useAuth()

  // Check if role selector should be shown
  useEffect(() => {
    setShowRoleSelector(env.isRoleSelectorEnabled())
  }, [])

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.metadata?.name || '',
      email: user?.email || '',
      phone: user?.metadata?.phone || '',
    },
  })

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        data: {
          name: values.name,
          phone: values.phone,
        },
      })

      if (error) {
        toast({
          title: 'Erro ao atualizar perfil',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro ao atualizar perfil',
        description: 'Ocorreu um erro ao atualizar seu perfil. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!user) {
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
      <div className="mx-auto max-w-2xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Meu Perfil</h1>
            <p className="text-muted-foreground">
              Gerencie suas informações pessoais
            </p>
          </div>

          <div className="border rounded-lg p-6 shadow-sm">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="font-semibold" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Alterações
                </Button>
              </form>
            </Form>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Alterar Senha</h2>
            <Button variant="outline" asChild>
              <a href="/forgot-password">Solicitar alteração de senha</a>
            </Button>
          </div>

          {/* Role Selector for testing - only shown in development or when explicitly enabled */}
          {showRoleSelector && (
            <div className="border rounded-lg p-6">
              <h2 className="text-lg font-medium mb-4">Função no Sistema</h2>
              <div className="flex items-center space-x-2 mb-4">
                <div className="font-medium">Função atual:</div>
                <div className="px-2 py-1 bg-primary/10 rounded text-sm font-medium">{user.role}</div>
              </div>
              <RoleSelector />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
