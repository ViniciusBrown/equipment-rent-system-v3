'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2, ShieldCheck } from 'lucide-react'

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
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

// Form schema with validation
const formSchema = z.object({
  password: z.string().min(8, {
    message: 'A senha deve ter pelo menos 8 caracteres.',
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
})

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Initialize form with react-hook-form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  // Form submission handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) {
        toast({
          title: 'Erro ao redefinir senha',
          description: error.message,
          variant: 'destructive',
        })
        return
      }

      setIsSubmitted(true)
      toast({
        title: 'Senha redefinida com sucesso',
        description: 'Sua senha foi atualizada. Você já pode fazer login com sua nova senha.',
      })

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      toast({
        title: 'Erro ao redefinir senha',
        description: 'Ocorreu um erro ao redefinir sua senha. Tente novamente mais tarde.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Check if the user has a valid reset token
  useEffect(() => {
    const checkResetToken = async () => {
      // The token is automatically handled by Supabase when the page loads
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        toast({
          title: 'Link inválido ou expirado',
          description: 'O link de redefinição de senha é inválido ou expirou. Solicite um novo link.',
          variant: 'destructive',
        })
        router.push('/forgot-password')
      }
    }

    checkResetToken()
  }, [router, toast])

  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-full max-w-md">
        <Card className="border shadow-lg overflow-hidden">
          <CardHeader className="space-y-1 text-center bg-primary/5 border-b pb-8">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-primary/10 p-4 ring-2 ring-primary/20">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
            <CardDescription>
              Digite sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {isSubmitted ? (
              <div className="flex flex-col space-y-4">
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-sm">
                    Sua senha foi redefinida com sucesso. Redirecionando para a página de login...
                  </p>
                </div>
                <Button asChild>
                  <Link href="/login">Ir para o login</Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nova Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="********" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full font-semibold" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Redefinir Senha
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col bg-muted/30 border-t py-6">
            <div className="text-center text-sm">
              <Link href="/login" className="font-medium text-primary hover:underline transition-colors">
                Voltar para o login
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-10">
        <div className="w-full max-w-md">
          <Card className="border shadow-lg overflow-hidden">
            <CardHeader className="space-y-1 text-center bg-primary/5 border-b pb-8">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-primary/10 p-4 ring-2 ring-primary/20">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold">Redefinir senha</CardTitle>
              <CardDescription>
                Carregando...
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
