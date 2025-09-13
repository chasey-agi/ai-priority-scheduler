import { createServerComponentClient } from '@/lib/supabase-server'
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
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          provider: user.app_metadata?.provider || 'email',
          provider_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (userError) {
        console.error('Error creating/updating user:', userError)
      }
    }
  }

  // Redirect to the main app after successful authentication
  return NextResponse.redirect(`${origin}/tasks`)
}