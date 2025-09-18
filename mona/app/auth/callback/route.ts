import { createServerComponentClient, ensureUserProfile } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createServerComponentClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`)
    }

    // Get the authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Create or update user record
      await ensureUserProfile(supabase, user)
    }
  }

  // Redirect to the main app after successful authentication
  return NextResponse.redirect(`${origin}/tasks`)
}