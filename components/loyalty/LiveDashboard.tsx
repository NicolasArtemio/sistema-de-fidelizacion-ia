'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StampCard from '@/components/loyalty/StampCard'
import LastVisitCard from '@/components/loyalty/LastVisitCard'
import GameRules from '@/components/loyalty/GameRules'
import ClientQR from '@/components/loyalty/ClientQR'
import MissionsList from '@/components/loyalty/MissionsList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutGrid, Rocket, QrCode, ScrollText } from 'lucide-react'

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
    const [activeTab, setActiveTab] = useState('dashboard')
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
                        console.log('⚡ Points updated:', newProfile.points)
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
                        console.log('⚡ New Visit Detected:', newTx.created_at)
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
            <div className="space-y-8 max-w-md mx-auto mt-6">
                <div className="h-32 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-48 bg-white/5 rounded-xl animate-pulse" />
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-2">
            <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
                {/* Main Content Area */}
                <div className="min-h-[calc(100vh-140px)]">
                    <TabsContent value="dashboard" className="space-y-8 mt-0 focus-visible:ring-0">
                        {/* Last Visit Reminder */}
                        <section>
                            <LastVisitCard lastVisitDate={lastVisitDate} />
                        </section>

                        {/* Stamp Card */}
                        <section>
                            <StampCard points={points} />
                        </section>

                        {/* Game Rules Preview */}
                        <section>
                            <GameRules />
                        </section>
                    </TabsContent>

                    <TabsContent value="missions" className="mt-0 focus-visible:ring-0">
                        <MissionsList />
                    </TabsContent>
                    
                    <TabsContent value="qr" className="mt-0 focus-visible:ring-0 pt-4">
                         <ClientQR userId={userId} userName={userName} />
                    </TabsContent>
                </div>

                {/* Bottom Navigation Bar */}
                <div className="fixed bottom-0 left-0 right-0 bg-neutral-950/90 backdrop-blur-md border-t border-white/5 px-6 py-3 z-50">
                    <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto h-auto bg-transparent p-0 gap-2">
                        <TabsTrigger 
                            value="dashboard" 
                            className="flex flex-col items-center gap-1.5 py-2 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <LayoutGrid className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Inicio</span>
                        </TabsTrigger>
                        
                        <TabsTrigger 
                            value="missions" 
                            className="flex flex-col items-center gap-1.5 py-2 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <Rocket className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Misiones</span>
                        </TabsTrigger>
                        
                        <TabsTrigger 
                            value="qr" 
                            className="flex flex-col items-center gap-1.5 py-2 data-[state=active]:bg-transparent data-[state=active]:text-amber-500 text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <QrCode className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Mi QR</span>
                        </TabsTrigger>
                    </TabsList>
                </div>
            </Tabs>
        </div>
    )
}
