import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          try {
            return request.cookies.get(name)?.value
          } catch (error) {
            console.error('Error getting cookie in middleware:', error)
            return undefined
          }
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          } catch (error) {
            console.error('Error setting cookie in middleware:', error)
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          } catch (error) {
            console.error('Error removing cookie in middleware:', error)
          }
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
