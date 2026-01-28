'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import StampCard from '@/components/loyalty/StampCard'
import LastVisitCard from '@/components/loyalty/LastVisitCard'
import GameRules from '@/components/loyalty/GameRules'
import ClientQR from '@/components/loyalty/ClientQR'

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
    const supabase = createClient()

    useEffect(() => {
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

    return (
        <div className="space-y-8 max-w-md mx-auto mt-6">
            {/* Last Visit Reminder */}
            <section>
                <LastVisitCard lastVisitDate={lastVisitDate} />
            </section>

            {/* Stamp Card */}
            <section>
                <StampCard points={points} />
            </section>

             {/* Personal QR Code */}
             <section className="pt-4">
                <ClientQR userId={userId} userName={userName} />
            </section>

            {/* Game Rules & Rewards */}
            <GameRules />
        </div>
    )
}
