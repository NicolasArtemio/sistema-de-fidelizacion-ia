'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Calendar, Gift } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getAdminStats } from '@/app/server-actions'

interface AdminStatsProps {
    initialStats: {
        totalClients: number
        visitsToday: number
        totalRedeemed: number
    }
}

export default function AdminStats({ initialStats }: AdminStatsProps) {
    const [stats, setStats] = useState(initialStats)
    const supabase = createClient()

    useEffect(() => {
        // Refresh stats function
        const refreshStats = async () => {
            try {
                const newStats = await getAdminStats()
                setStats(newStats)
            } catch (error) {
                console.error('Error refreshing stats:', error)
            }
        }

        // Subscribe to real-time changes
        const channel = supabase
            .channel('admin-stats-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'transactions'
                },
                () => {
                    console.log('🔔 Transactions update detected, refreshing stats...')
                    refreshStats()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles'
                },
                () => {
                    console.log('🔔 Profiles update detected, refreshing stats...')
                    refreshStats()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    return (
        <section className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Clients */}
            <Card className="bg-zinc-900/50 border-white/5 w-full">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-full shrink-0">
                        <Users className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Clientes</p>
                        <p className="text-2xl font-bold text-blue-500">{stats.totalClients}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Visits Today */}
            <Card className="bg-zinc-900/50 border-white/5 w-full">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-full shrink-0">
                        <Calendar className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Visitas Hoy</p>
                        <p className="text-2xl font-bold text-emerald-500">{stats.visitsToday}</p>
                    </div>
                </CardContent>
            </Card>

            {/* Total Rewards Redeemed (Premios) */}
            <Card className="bg-zinc-900/50 border-white/5 w-full">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-500/10 rounded-full shrink-0">
                        <Gift className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Premios Canjeados</p>
                        <p className="text-2xl font-bold text-amber-500">{stats.totalRedeemed}</p>
                    </div>
                </CardContent>
            </Card>
        </section>
    )
}
