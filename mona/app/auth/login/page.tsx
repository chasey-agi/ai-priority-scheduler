'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithGoogle } from '@/hooks/useAuth'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { Brain, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push('/tasks')
    }
  }, [user, loading, router])

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      setError(null)
      await signInWithGoogle()
      // The redirect will be handled by the auth callback
    } catch (err) {
      console.error('Sign in error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during sign in')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 animate-in fade-in-50 duration-700">
          {/* Header Section */}
           <div className="text-center space-y-4">
             <div className="flex justify-center">
               <div className="w-16 h-16 bg-gray-900 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group">
                 <Brain className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
               </div>
             </div>
             
             <div className="space-y-1">
               <h1 className="text-3xl font-bold text-gray-900 animate-in slide-in-from-bottom-4 duration-700 delay-200">
                 AI Priority Scheduler
               </h1>
               <p className="text-gray-600 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                 智能任务管理
               </p>
             </div>
           </div>
          
          {/* Login Card */}
           <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-6 duration-700 delay-400">
             <CardHeader className="text-center">
               <CardTitle className="text-xl text-gray-900">登录</CardTitle>
               <CardDescription className="text-gray-600">
                 使用 Google 账户登录
               </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
               {error && (
                 <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
                   <AlertCircle className="w-4 h-4 flex-shrink-0" />
                   <span className="text-sm">{error}</span>
                 </div>
               )}
               
               <Button
                 onClick={handleGoogleSignIn}
                 disabled={isLoading}
                 onMouseEnter={() => setIsHovered(true)}
                 onMouseLeave={() => setIsHovered(false)}
                 className="w-full h-12 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 hover:border-gray-400 transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                 variant="outline"
               >
                 {isLoading ? (
                   <>
                     <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                     <span className="font-medium">正在登录...</span>
                   </>
                 ) : (
                   <>
                     <svg 
                       className={`mr-3 h-5 w-5 transition-transform duration-200 ${isHovered ? 'scale-110' : 'scale-100'}`} 
                       viewBox="0 0 24 24"
                     >
                       <path
                         fill="#4285F4"
                         d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                       />
                       <path
                         fill="#34A853"
                         d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                       />
                       <path
                         fill="#FBBC05"
                         d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                       />
                       <path
                         fill="#EA4335"
                         d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                       />
                     </svg>
                     <span className="font-medium group-hover:text-gray-900 transition-colors duration-200">使用 Google 登录</span>
                   </>
                 )}
               </Button>
               
               {/* Success feedback for future use */}
               {/* {success && (
                 <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2 animate-in slide-in-from-top-2 duration-300">
                   <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                   <span className="text-sm">登录成功！正在跳转...</span>
                 </div>
               )} */}
               
               <div className="text-xs text-gray-500 text-center pt-2">
                 <p className="leading-relaxed">
                   登录即表示您同意我们的
                   <button className="text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200 mx-1">服务条款</button>
                   和
                   <button className="text-blue-600 hover:text-blue-700 hover:underline transition-colors duration-200 ml-1">隐私政策</button>
                 </p>
               </div>
             </CardContent>
           </Card>
        </div>
      </div>
     </div>
  )
}