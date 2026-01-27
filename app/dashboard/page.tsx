import { getSessionUserProfile } from '@/app/auth-actions'
import { logout } from '@/app/server-actions'
import { redirect } from 'next/navigation'
import StampCard from '@/components/loyalty/StampCard'
import ClientQR from '@/components/loyalty/ClientQR'
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

            <main className="p-4 space-y-8 max-w-md mx-auto mt-6">
                
                {/* Stamp Card */}
                <section>
                    <StampCard points={profile.points} />
                </section>

                {/* Personal QR Code */}
                <section className="pt-4">
                    <ClientQR userId={profile.id} userName={profile.full_name || 'Cliente'} />
                </section>

                {/* History / Info */}
                <section className="text-center space-y-3">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-[0.2em]">Recompensas</h3>
                    <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400">
                        <div className="p-3 border border-gold-500/20 rounded-lg bg-neutral-900/50 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                            <span className="block text-gold-500 font-extrabold text-lg mb-1">5</span>
                            Bebida
                        </div>
                        <div className="p-3 border border-gold-500/20 rounded-lg bg-neutral-900/50 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                            <span className="block text-gold-500 font-extrabold text-lg mb-1">10</span>
                            20% Off
                        </div>
                        <div className="p-3 border border-gold-500/20 rounded-lg bg-neutral-900/50 backdrop-blur-sm shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                            <span className="block text-gold-500 font-extrabold text-lg mb-1">15</span>
                            Corte
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
}
