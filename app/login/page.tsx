'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'

const ERROR_MESSAGES: Record<string, string> = {
  access_denied: 'Access denied. You cancelled the Google sign-in.',
  no_auth_data: 'Sign-in failed. Please try again.',
  bad_oauth_callback: 'OAuth callback failed. Please try again.',
}

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get('error')
    const errorCode = searchParams.get('error_code')
    const description = searchParams.get('error_description')
    if (error) {
      const msg =
        ERROR_MESSAGES[errorCode ?? error] ??
        (description ? decodeURIComponent(description.replace(/\+/g, ' ')) : 'Authentication error.')
      toast.error(msg, { duration: 6000 })
    }
  }, [searchParams])

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Use skipBrowserRedirect=true to get the OAuth URL without
      // triggering Supabase's internal state/cookie mechanism.
      // We then navigate directly to the URL ourselves.
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error || !data.url) {
        toast.error('Failed to start login: ' + (error?.message ?? 'No URL returned'))
        setLoading(false)
        return
      }

      // Navigate directly to the Google OAuth URL
      window.location.href = data.url
    } catch (err) {
      toast.error('Unexpected error. Please try again.')
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-primary)' }}>
      {/* Left hero panel */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #312e81 0%, #1e1b4b 50%, #0f0e0d 100%)' }}
      >
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle at 30% 20%, #818cf8 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, #6366f1 0%, transparent 40%)`,
        }} />
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
              M
            </div>
            <span className="text-white font-bold text-xl tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              Markd
            </span>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-white leading-tight mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
            Your bookmarks,{' '}
            <span style={{ color: '#a5b4fc' }}>beautifully organised.</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Save links, add categories, search instantly. Your personal knowledge hub — private and always in sync.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap gap-3">
          {['Real-time sync', 'Private & secure', 'Smart search', 'Dark mode'].map((f) => (
            <span key={f} className="text-sm px-4 py-2 rounded-full" style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)',
            }}>
              {f}
            </span>
          ))}
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex lg:hidden items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg text-white"
              style={{ background: 'var(--accent)' }}>M</div>
            <span className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
              Markd
            </span>
          </div>

          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
            Welcome back
          </h2>
          <p className="mb-10" style={{ color: 'var(--text-secondary)' }}>
            Sign in to access your personal bookmark collection.
          </p>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-2xl font-medium text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {loading ? (
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--text-muted)', borderTopColor: 'var(--accent)' }} />
            ) : (
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {loading ? 'Redirecting to Google...' : 'Continue with Google'}
          </button>

          <p className="text-center text-sm mt-8" style={{ color: 'var(--text-muted)' }}>
            By signing in, you agree to our{' '}
            <span style={{ color: 'var(--accent)' }} className="cursor-pointer hover:underline">Terms</span>{' '}
            and{' '}
            <span style={{ color: 'var(--accent)' }} className="cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
