import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LoginForm from '@/components/auth/LoginForm'

export default async function Home() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-neutral-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-black">
      <div className="w-full max-w-lg animate-in fade-in zoom-in duration-500">
        <LoginForm />
      </div>
    </main>
  )
}
