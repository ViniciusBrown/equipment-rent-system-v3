'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { createContext, useContext, useEffect, useState } from 'react'

// We'll create a new supabase client when needed

// Types
export type UserRole = 'client' | 'equipment_inspector' | 'financial_inspector' | 'manager';

export type AuthUser = {
  id: string
  email: string
  role: UserRole
  metadata: {
    name?: string
  }
}

export type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string, role?: UserRole) => Promise<{
    error: Error | null
    data: any | null
  }>
  signIn: (email: string, password: string) => Promise<{
    error: Error | null
    data: any | null
  }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{
    error: Error | null
    data: any | null
  }>
}

// Create context
export const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for session on initial load
  useEffect(() => {
    const getSession = async () => {
      const supabase = createClientComponentClient()
      const { data, error } = await supabase.auth.getSession()

      if (!error && data.session) {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          setUser({
            id: userData.user.id,
            email: userData.user.email!,
            role: (userData.user.user_metadata?.role as UserRole) || 'client',
            metadata: userData.user.user_metadata as { name?: string }
          })
        }
      }

      setLoading(false)
    }

    getSession()

    // Set up auth state listener
    const supabase = createClientComponentClient()
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: (session.user.user_metadata?.role as UserRole) || 'client',
            metadata: session.user.user_metadata as { name?: string }
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Sign up function
  const signUp = async (email: string, password: string, name: string, role: UserRole = 'client') => {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
        },
      },
    })
    return { data, error }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  // Sign out function
  const signOut = async () => {
    const supabase = createClientComponentClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    const supabase = createClientComponentClient()
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
