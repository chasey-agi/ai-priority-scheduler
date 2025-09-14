import { Suspense } from 'react'
import ErrorPageClient from './ErrorPageClient'

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ErrorPageClient />
    </Suspense>
  )
}