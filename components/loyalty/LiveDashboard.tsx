// path/to/components/loyalty/LiveDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StampCard from '@/components/loyalty/StampCard'
import LastVisitCard from '@/components/loyalty/LastVisitCard'
import GameRules from '@/components/loyalty/GameRules'
import ClientQR from '@/components/loyalty/ClientQR'
import MissionsList from '@/components/loyalty/MissionsList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutGrid, Rocket, User } from 'lucide-react'

interface LiveDashboardProps {
    initialPoints: number
    initialLastVisitDate: string | null
    userId: string
    userName: string
}

export default function LiveDashboard({ 
    initialPoints, 
    initialLastVisitDate, 
    userId, 
    userName 
}: LiveDashboardProps) {
    const [points, setPoints] = useState(initialPoints)
    const [lastVisitDate, setLastVisitDate] = useState(initialLastVisitDate)
    const [hasMounted, setHasMounted] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        setHasMounted(true)

        // 1. Subscribe to Profile Changes (Points)
        const profileChannel = supabase
            .channel('profile-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${userId}`
                },
                (payload) => {
                    const newProfile = payload.new as any
                    if (newProfile && newProfile.points !== undefined) {
                        setPoints(newProfile.points)
                    }
                }
            )
            .subscribe()

        // 2. Subscribe to Transaction Inserts (Last Visit)
        const txChannel = supabase
            .channel('tx-updates')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'transactions',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    const newTx = payload.new as any
                    if (newTx && newTx.type === 'earn') {
                        setLastVisitDate(newTx.created_at)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(profileChannel)
            supabase.removeChannel(txChannel)
        }
    }, [userId, supabase])

    if (!hasMounted) {
        return (
            <div className="space-y-8 max-w-md mx-auto mt-6 px-4">
                <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <Tabs defaultValue="inicio" className="w-full">
                {/* Main Content Area - Added padding bottom to account for fixed nav */}
                <div className="pb-24 px-4 pt-4 max-w-md mx-auto">
                    
                    {/* TAB 1: INICIO */}
                    <TabsContent value="inicio" className="space-y-8 focus-visible:ring-0 mt-0">
                        {/* Last Visit Reminder */}
                        <section>
                            <LastVisitCard lastVisitDate={lastVisitDate} />
                        </section>

                        {/* Stamp Card */}
                        <section>
                            <StampCard points={points} />
                        </section>

                        {/* QR Code */}
                        <section>
                             <ClientQR userId={userId} userName={userName} />
                        </section>

                        {/* Game Rules Preview */}
                        <section>
                            <GameRules />
                        </section>
                    </TabsContent>

                    {/* TAB 2: MISIONES */}
                    <TabsContent value="misiones" className="focus-visible:ring-0 mt-0">
                        <MissionsList />
                    </TabsContent>
                    
                    {/* TAB 3: PERFIL */}
                    <TabsContent value="perfil" className="focus-visible:ring-0 mt-0">
                         <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center border border-white/10">
                                <User className="w-10 h-10 text-zinc-500" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">{userName}</h2>
                                <p className="text-zinc-500 text-sm">Perfil de Usuario</p>
                            </div>
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg max-w-xs">
                                <p className="text-amber-500 text-sm">Historial y Configuración próximamente.</p>
                            </div>
                         </div>
                    </TabsContent>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-neutral-950/90 backdrop-blur-md border-t border-white/5 px-6 py-2 z-50">
                    <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto h-auto bg-transparent p-0 gap-2">
                        <TabsTrigger 
                            value="inicio" 
                            className="flex flex-col items-center gap-1.5 py-2 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            <LayoutGrid className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Inicio</span>
                        </TabsTrigger>
                        
                        <TabsTrigger 
                            value="misiones" 
                            className="flex flex-col items-center gap-1.5 py-2 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            <Rocket className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Misiones</span>
                        </TabsTrigger>
                        
                        <TabsTrigger 
                            value="perfil" 
                            className="flex flex-col items-center gap-1.5 py-2 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-zinc-600 hover:text-zinc-400 transition-colors"
                        >
                            <User className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Perfil</span>
                        </TabsTrigger>
                    </TabsList>
                </div>
            </Tabs>
        </div>
    )
}
