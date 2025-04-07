import { createServerClient } from '@supabase/ssr'
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
        getAll() {
          try {
            return request.cookies.getAll().map((cookie) => ({
              name: cookie.name,
              value: cookie.value,
            }))
          } catch (error) {
            console.error('Error getting cookies in middleware:', error)
            return []
          }
        },
        setAll(cookieList) {
          try {
            cookieList.forEach((cookie) => {
              request.cookies.set({
                name: cookie.name,
                value: cookie.value,
                ...cookie.options,
              })

              // Create a new response with updated headers
              response = NextResponse.next({
                request: {
                  headers: request.headers,
                },
              })

              // Set the cookie in the response
              response.cookies.set({
                name: cookie.name,
                value: cookie.value,
                ...cookie.options,
              })
            })
          } catch (error) {
            console.error('Error setting cookies in middleware:', error)
          }
        },
      },
    }
  )

  await supabase.auth.getUser()

  return response
}
