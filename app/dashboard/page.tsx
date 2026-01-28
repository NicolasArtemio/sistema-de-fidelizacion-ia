import { getSessionUserProfile } from '@/app/auth-actions'
import { logout, getLastVisitDate } from '@/app/server-actions'
import { redirect } from 'next/navigation'
import LiveDashboard from '@/components/loyalty/LiveDashboard'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default async function Dashboard() {
    const profile = await getSessionUserProfile()

    if (!profile) {
        redirect('/')
    }

    if (profile.role === 'admin') {
        redirect('/admin')
    }

    const lastVisitDate = await getLastVisitDate(profile.id)

    return (
        <div className="min-h-screen bg-neutral-950 pb-20">
            {/* Header */}
            <header className="p-4 flex justify-between items-center border-b border-gold-500/10 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
                         <img 
                             src="/blogo.png?v=1" 
                             alt="tulook logo" 
                             className="w-full h-full object-contain drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]"
                         />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-lg leading-none tracking-tight">tulook</h1>
                        <p className="text-xs text-zinc-400">Hola, {profile.full_name?.split(' ')[0]}</p>
                    </div>
                </div>
                <form action={logout}>
                    <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-red-400 hover:bg-red-950/20">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </form>
            </header>

            <main className="p-4">
                <LiveDashboard 
                    initialPoints={profile.points} 
                    initialLastVisitDate={lastVisitDate}
                    userId={profile.id}
                    userName={profile.full_name || 'Cliente'}
                />
            </main>
        </div>
    )
}
