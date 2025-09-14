'use client'

import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth, getProfile, signOut } from '@/hooks/useAuth'
import { User, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  name?: string
  avatar_url?: string
}

export function UserAvatar() {
  const { user, loading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (user && !loading) {
      setProfileLoading(true)
      getProfile(user.id)
        .then(setProfile)
        .catch(console.error)
        .finally(() => setProfileLoading(false))
    }
  }, [user, loading])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  if (loading || profileLoading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-200 animate-pulse" />
    )
  }

  if (!user) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/auth/login')}
        className="text-sm"
      >
        登录
      </Button>
    )
  }

  const displayName = profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || '用户'
  const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback className="bg-slate-100 text-slate-600">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>个人资料</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}