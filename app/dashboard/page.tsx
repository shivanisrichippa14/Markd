import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'
import { DashboardClient } from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()

  // getSession() reads the cookie — no network call to Supabase.
  // Middleware already guards this route so session should always exist.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Pass minimal user info to client — bookmarks are fetched client-side
  // to avoid server-side network calls to Supabase which fail on restricted networks.
  return (
    <DashboardClient
      userId={session.user.id}
      userEmail={session.user.email ?? ''}
      userName={(session.user.user_metadata?.full_name as string) ?? session.user.email ?? 'User'}
      userAvatar={(session.user.user_metadata?.avatar_url as string) ?? ''}
    />
  )
}
