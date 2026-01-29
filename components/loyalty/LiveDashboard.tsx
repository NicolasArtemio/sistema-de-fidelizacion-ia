// path/to/components/loyalty/LiveDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import LastVisitCard from '@/components/loyalty/LastVisitCard'
import ClientQR from '@/components/loyalty/ClientQR'
import MissionsList from '@/components/loyalty/MissionsList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutGrid, Rocket, User, Crown, Scissors, Coffee, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

import UserProfile from '@/components/loyalty/UserProfile'

interface LiveDashboardProps {
    initialPoints: number
    initialLastVisitDate: string | null
    userId: string
    userName: string
}

const REWARDS = [
    {
        id: 'snack',
        name: 'Bebida / Snack',
        cost: 600,
        icon: <Coffee className="w-5 h-5 text-amber-500" />,
        description: 'Refresco o snack a elección'
    },
    {
        id: 'beard',
        name: 'Perfilado de Barba',
        cost: 900,
        icon: <Scissors className="w-5 h-5 text-amber-500" />,
        description: 'Alineación y cuidado de barba'
    },
    {
        id: 'haircut',
        name: 'Corte de Pelo',
        cost: 1200,
        icon: <Scissors className="w-5 h-5 text-amber-500" />,
        description: 'Corte de cabello completo'
    },
    {
        id: 'full_service',
        name: 'Corte y Barba',
        cost: 1600,
        icon: <Sparkles className="w-5 h-5 text-amber-500" />,
        description: 'Servicio premium completo'
    }
]

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
                    <TabsContent value="inicio" className="space-y-6 focus-visible:ring-0 mt-0">
                        
                        {/* 1. Premium Points Summary Card */}
                        <Card className="bg-zinc-900 border-zinc-800 shadow-xl overflow-hidden relative">
                            {/* Decorative gradient glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
                            
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center relative z-10">
                                <div className="mb-2 p-2 bg-amber-500/10 rounded-full">
                                    <Crown className="w-6 h-6 text-amber-500" />
                                </div>
                                <h2 className="text-sm font-medium text-zinc-400 uppercase tracking-widest mb-1">Tu Balance</h2>
                                <div className="flex items-baseline gap-1 mb-2">
                                    <span className="text-5xl font-black text-white tracking-tight">{points}</span>
                                    <span className="text-lg font-bold text-amber-500">pts</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Redemption Catalog Grid */}
                        <section>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    Catálogo de Canjes
                                </h3>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-3">
                                {REWARDS.map((reward) => {
                                    const canRedeem = points >= reward.cost
                                    const progress = Math.min((points / reward.cost) * 100, 100)
                                    
                                    return (
                                        <Card key={reward.id} className={`bg-zinc-900/50 border-white/5 overflow-hidden group transition-all duration-300 ${canRedeem ? 'hover:border-amber-500/30 hover:bg-zinc-900' : 'opacity-80'}`}>
                                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${canRedeem ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-600'}`}>
                                                        {reward.icon}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className={`font-bold text-sm ${canRedeem ? 'text-white' : 'text-zinc-400'}`}>
                                                            {reward.name}
                                                        </span>
                                                        <span className="text-xs text-amber-500 font-bold">
                                                            {reward.cost.toLocaleString()} pts
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <Button 
                                                    size="sm" 
                                                    disabled={!canRedeem}
                                                    className={`h-9 px-4 rounded-lg text-xs font-bold transition-all ${
                                                        canRedeem 
                                                            ? 'bg-amber-500 hover:bg-amber-600 text-black shadow-[0_0_15px_-5px_rgba(245,158,11,0.5)]' 
                                                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                                    }`}
                                                >
                                                    {canRedeem ? 'Canjear' : 'Faltan pts'}
                                                </Button>
                                            </CardContent>
                                            
                                            {/* Progress Bar for Locked Items */}
                                            {!canRedeem && (
                                                <div className="w-full h-1 bg-zinc-800 mt-0">
                                                    <div 
                                                        className="h-full bg-amber-500/30" 
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </Card>
                                    )
                                })}
                            </div>
                        </section>

                        {/* 3. QR Code (Always Accessible) */}
                        <section className="pt-2">
                             <ClientQR userId={userId} userName={userName} />
                        </section>

                        {/* Last Visit Reminder (Subtle at bottom) */}
                        <section className="opacity-80">
                            <LastVisitCard lastVisitDate={lastVisitDate} />
                        </section>

                    </TabsContent>
                    
                    {/* TAB 2: MISIONES */}
                    <TabsContent value="misiones" className="focus-visible:ring-0 mt-0">
                        <MissionsList />
                    </TabsContent>
                    
                    {/* TAB 3: PERFIL */}
                    <TabsContent value="perfil" className="focus-visible:ring-0 mt-0">
                         <UserProfile userId={userId} userName={userName} currentPoints={points} />
                    </TabsContent>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="fixed bottom-0 left-0 right-0 w-full bg-neutral-950/90 backdrop-blur-md border-t border-white/5 px-6 py-2 z-50">
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
