'use client'

import { createClient } from '@/utils/supabase/client'
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
    phone?: string
  }
}

export type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  signUp: (email: string, password: string, name: string, phone?: string, role?: UserRole) => Promise<{
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
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      if (!error && data.session) {
        const { data: userData } = await supabase.auth.getUser()
        if (userData.user) {
          // Log user data for debugging
          console.log('Auth user data:', {
            id: userData.user.id,
            email: userData.user.email,
            user_metadata: userData.user.user_metadata,
            app_metadata: userData.user.app_metadata
          })

          // Try to get role from different places
          const metadataRole = userData.user.user_metadata?.role
          const appMetadataRole = userData.user.app_metadata?.role
          const role = (metadataRole || appMetadataRole || 'client') as UserRole

          console.log('Determined role:', role)

          setUser({
            id: userData.user.id,
            email: userData.user.email!,
            role: role,
            metadata: userData.user.user_metadata as { name?: string, phone?: string }
          })
        }
      }

      setLoading(false)
    }

    getSession()

    // Set up auth state listener
    const supabase = createClient()
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          // Log session user data for debugging
          console.log('Auth state change - user data:', {
            id: session.user.id,
            email: session.user.email,
            user_metadata: session.user.user_metadata,
            app_metadata: session.user.app_metadata
          })

          // Try to get role from different places
          const metadataRole = session.user.user_metadata?.role
          const appMetadataRole = session.user.app_metadata?.role
          const role = (metadataRole || appMetadataRole || 'client') as UserRole

          console.log('Auth state change - determined role:', role)

          setUser({
            id: session.user.id,
            email: session.user.email!,
            role: role,
            metadata: session.user.user_metadata as { name?: string, phone?: string }
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
  const signUp = async (email: string, password: string, name: string, phone: string = '', role: UserRole = 'client') => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          role,
        },
      },
    })
    return { data, error }
  }

  // Sign in function
  const signIn = async (email: string, password: string) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  // Sign out function
  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  // Reset password function
  const resetPassword = async (email: string) => {
    const supabase = createClient()
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
