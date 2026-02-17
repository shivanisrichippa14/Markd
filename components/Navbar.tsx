'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ThemeToggle } from './ThemeToggle'
import type { User } from '@supabase/supabase-js'

interface NavbarProps {
  user: User
}

export function Navbar({ user }: NavbarProps) {
  const [signingOut, setSigningOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    setSigningOut(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast.error('Sign out failed.')
      setSigningOut(false)
    } else {
      router.push('/login')
      router.refresh()
    }
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? 'User'
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{
        background: 'rgba(var(--bg-card-rgb, 255,255,255), 0.85)',
        borderColor: 'var(--border)',
        backgroundColor: 'color-mix(in srgb, var(--bg-card) 85%, transparent)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'var(--accent)', fontFamily: 'Syne, sans-serif' }}
          >
            M
          </div>
          <span
            className="font-bold text-lg tracking-tight hidden sm:block"
            style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}
          >
            Markd
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {/* User avatar */}
          <div className="flex items-center gap-2 sm:gap-3">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="w-8 h-8 rounded-full object-cover ring-2"
                style={{ ringColor: 'var(--border)' }}
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                style={{ background: 'var(--accent)' }}
              >
                {initials}
              </div>
            )}
            <span
              className="text-sm font-medium hidden md:block max-w-[140px] truncate"
              style={{ color: 'var(--text-secondary)' }}
            >
              {name.split(' ')[0]}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'var(--bg-subtle)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--danger)'
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
              ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            }}
          >
            {signingOut ? (
              <div
                className="w-4 h-4 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--text-muted)', borderTopColor: 'var(--accent)' }}
              />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            )}
            <span className="hidden sm:inline">{signingOut ? 'Signing out...' : 'Sign out'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
