// path/to/AdminHistory.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { History, ArrowUpRight, ArrowDownLeft, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Transaction {
    id: string
    created_at: string
    type: 'earn' | 'redeem'
    amount: number
    description: string
    profiles: {
        full_name: string
    }
}

export default function AdminHistory() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select(`
                    id,
                    created_at,
                    type,
                    amount,
                    description,
                    profiles:user_id (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error
            
            // Safe cast since we know the structure
            setTransactions(data as any[])
        } catch (err) {
            console.error('Error fetching history:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()

        // Realtime subscription for new transactions
        const channel = supabase
            .channel('admin-history')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'transactions'
                },
                () => {
                    fetchHistory()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <Card className="w-full bg-card border-white/5 mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <History className="w-5 h-5 text-primary" />
                    Historial Reciente
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Cargando historial...</div>
                ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No hay movimientos recientes</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-white/10 hover:bg-transparent">
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Acción</TableHead>
                                    <TableHead className="text-right">Monto</TableHead>
                                    <TableHead className="text-right">Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/5">
                                        <TableCell className="font-medium text-white">
                                            {tx.profiles?.full_name || 'Desconocido'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    {tx.type === 'earn' ? (
                                                        <div className="p-1 rounded bg-emerald-500/10">
                                                            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="p-1 rounded bg-red-500/10">
                                                            <ArrowDownLeft className="w-3 h-3 text-red-500" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium text-zinc-200">
                                                        {tx.description?.split(' (Por:')[0] || (tx.type === 'earn' ? 'Carga de Puntos' : 'Canje')}
                                                    </span>
                                                </div>
                                                {tx.description?.includes('(Por:') && (
                                                    <span className="text-[10px] text-zinc-500 ml-7 font-mono">
                                                        {tx.description.match(/\(Por: .*?\)/)?.[0]}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right font-bold ${
                                            tx.type === 'earn' ? 'text-emerald-400' : 'text-red-400'
                                        }`}>
                                            {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs">
                                            {format(new Date(tx.created_at), "d MMM, HH:mm", { locale: es })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}