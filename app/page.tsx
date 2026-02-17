import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabaseServer'

export default async function Home() {
  const supabase = await createClient()
  // getSession() reads the cookie only — no network call to Supabase
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
