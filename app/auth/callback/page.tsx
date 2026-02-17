'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const supabase = createClient()

    async function handleCallback() {
      const url = new URL(window.location.href)

      // ── OAuth provider-level error ────────────────────────────────────
      const errorParam = url.searchParams.get('error')
      const errorCode = url.searchParams.get('error_code')
      const errorDescription = url.searchParams.get('error_description')
      if (errorParam || errorCode) {
        const msg = errorDescription
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : errorParam ?? 'Authentication failed'
        router.replace(`/login?error=${encodeURIComponent(errorParam ?? 'oauth_error')}&error_code=${encodeURIComponent(errorCode ?? '')}&error_description=${encodeURIComponent(msg)}`)
        return
      }

      // ── Implicit flow: tokens in URL hash ─────────────────────────────
      if (url.hash && url.hash.length > 1) {
        const hashParams = new URLSearchParams(url.hash.slice(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const hashError = hashParams.get('error')

        if (hashError) {
          setErrorMsg(hashParams.get('error_description') ?? hashError)
          setStatus('error')
          return
        }

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })
          if (error) { setErrorMsg(error.message); setStatus('error'); return }
          router.replace('/dashboard')
          return
        }
      }

      // ── PKCE flow: code in query string ───────────────────────────────
      // When skipBrowserRedirect=true is used, Supabase uses PKCE but
      // stores the verifier in localStorage before we redirect manually.
      // exchangeCodeForSession runs in the BROWSER here, so it can
      // read localStorage and also reach Supabase directly.
      const code = url.searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
          router.replace('/dashboard')
          return
        }
        // If PKCE fails, try to get an existing session
        const { data: { session } } = await supabase.auth.getSession()
        if (session) { router.replace('/dashboard'); return }

        setErrorMsg(error.message)
        setStatus('error')
        return
      }

      // ── Already has a session ─────────────────────────────────────────
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { router.replace('/dashboard'); return }

      router.replace('/login?error=no_auth_data')
    }

    handleCallback()
  }, [router])

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>
            Sign-in failed
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
          <a href="/login" className="inline-block px-6 py-3 rounded-xl text-white text-sm font-medium"
            style={{ background: 'var(--accent)' }}>
            Back to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
      <div className="text-center">
        <div className="w-12 h-12 rounded-full border-4 animate-spin mx-auto mb-4"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
          Completing sign-in…
        </p>
      </div>
    </div>
  )
}
