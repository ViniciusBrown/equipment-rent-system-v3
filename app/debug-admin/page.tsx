'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

export default function DebugAdminPage() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  // Check if user is authorized (manager role)
  useEffect(() => {
    if (user && user.role === 'manager') {
      setIsAuthorized(true)
    }
  }, [user])

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true)

        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        setUserData({
          session: {
            user: {
              id: session?.user?.id,
              email: session?.user?.email,
              role: session?.user?.role,
              user_metadata: session?.user?.user_metadata,
            }
          },
          authContext: {
            user: user
          }
        })
      } catch (error) {
        console.error('Error fetching user data:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch user data',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [supabase, user, toast])

  const updateRoleToManager = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { role: 'manager' }
      })

      if (error) throw error

      toast({
        title: 'Role Updated',
        description: 'Your role has been updated to manager. You may need to refresh the page.',
      })

      // Reload the page to update the session
      window.location.reload()
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="container py-10">
      <Card>
        <CardHeader>
          <CardTitle>Debug Admin Page</CardTitle>
        </CardHeader>
        <CardContent>
          {!user ? (
            <p>Please log in to access this page.</p>
          ) : !isAuthorized ? (
            <div className="space-y-4">
              <p className="text-destructive">You are not authorized to access this page. Only managers can access this debug page.</p>
              <Button onClick={updateRoleToManager}>
                Set Role to Manager
              </Button>
            </div>
          ) : loading ? (
            <p>Loading user data...</p>
          ) : (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold mb-2">User Data:</h2>
                <pre className="bg-muted p-4 rounded overflow-auto max-h-[400px]">
                  {JSON.stringify(userData, null, 2)}
                </pre>
              </div>

              <div className="flex flex-col space-y-4">
                <Button onClick={() => window.location.href = '/admin/users'} variant="outline">
                  Go to Admin Users Page
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
