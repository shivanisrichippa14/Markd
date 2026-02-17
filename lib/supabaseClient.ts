import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// Singleton — reuse the same client instance across the app
// This is critical for Realtime: multiple instances = multiple connections
// that may conflict or not receive events properly
let client: SupabaseClient | null = null

export function createClient() {
  if (client) return client

  client = createBrowserClient(
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
          cookie += `; Path=${options?.path ?? '/'}`
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

  return client
}
