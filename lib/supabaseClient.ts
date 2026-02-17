import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase client with cookie-based storage.
 *
 * WHY COOKIES: signInWithOAuth stores the PKCE code_verifier before
 * redirecting to Google. If we use the default localStorage, it can
 * be lost during navigation in some environments. Storing it in
 * document.cookie ensures it persists through the full redirect cycle.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return ''
          const cookies = document.cookie.split(';')
          for (const cookie of cookies) {
            const [key, ...val] = cookie.trim().split('=')
            if (key === name) return decodeURIComponent(val.join('='))
          }
          return ''
        },
        set(name: string, value: string, options?: { maxAge?: number; path?: string; sameSite?: string; secure?: boolean }) {
          if (typeof document === 'undefined') return
          let cookie = `${name}=${encodeURIComponent(value)}`
          if (options?.maxAge) cookie += `; Max-Age=${options.maxAge}`
          if (options?.path) cookie += `; Path=${options.path}`
          else cookie += `; Path=/`
          if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
          if (options?.secure) cookie += `; Secure`
          document.cookie = cookie
        },
        remove(name: string, options?: { path?: string }) {
          if (typeof document === 'undefined') return
          document.cookie = `${name}=; Max-Age=0; Path=${options?.path ?? '/'}`
        },
      },
    }
  )
}
