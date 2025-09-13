import { createMiddlewareClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { supabase, supabaseResponse } = createMiddlewareClient(request)
  
  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession()
  
  const url = request.nextUrl.clone()
  
  // Define protected routes
  const protectedRoutes = ['/', '/tasks', '/analytics', '/api/tasks']
  const authRoutes = ['/auth/login']
  
  const isProtectedRoute = protectedRoutes.some(route => 
    url.pathname.startsWith(route)
  )
  const isAuthRoute = authRoutes.some(route => 
    url.pathname.startsWith(route)
  )
  
  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
  
  // Redirect to tasks if accessing auth routes with valid session
  if (isAuthRoute && session) {
    url.pathname = '/tasks'
    return NextResponse.redirect(url)
  }
  
  // Redirect to login if accessing root without session
  if (url.pathname === '/' && !session) {
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }
  
  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}