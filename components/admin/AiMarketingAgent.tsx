'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
    Sparkles, 
    MessageCircle, 
    TrendingUp, 
    AlertTriangle, 
    UserPlus, 
    Loader2, 
    RefreshCw,
    Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { generateMarketingInsights, MarketingInsight } from '@/app/ai-actions'
import { toast } from 'sonner'

export default function AiMarketingAgent() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<MarketingInsight | null>(null)
    const [isRegenerating, setIsRegenerating] = useState(false)

    const fetchInsights = async () => {
        try {
            setLoading(true)
            const result = await generateMarketingInsights()
            setData(result)
        } catch (error) {
            console.error(error)
            toast.error('Error al generar insights de IA')
        } finally {
            setLoading(false)
            setIsRegenerating(false)
        }
    }

    useEffect(() => {
        fetchInsights()
    }, [])

    const handleRefresh = () => {
        setIsRegenerating(true)
        fetchInsights()
    }

    const handleSendWhatsapp = (phone: string, message: string) => {
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        window.open(url, '_blank')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Loyal': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            case 'At Risk': return 'bg-red-500/20 text-red-400 border-red-500/30'
            case 'New': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
            default: return 'bg-zinc-800 text-zinc-400'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Loyal': return <TrendingUp className="w-4 h-4" />
            case 'At Risk': return <AlertTriangle className="w-4 h-4" />
            case 'New': return <UserPlus className="w-4 h-4" />
            default: return <Sparkles className="w-4 h-4" />
        }
    }

    if (loading && !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse"></div>
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin relative z-10" />
                </div>
                <p className="text-zinc-400 animate-pulse">Analizando patrones de clientes...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header with Global Summary */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6 md:grid-cols-1"
            >
                <Card className="bg-gradient-to-br from-indigo-950/50 to-purple-950/20 border-indigo-500/20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Sparkles className="w-32 h-32 text-indigo-500" />
                    </div>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-lg">
                                    <Sparkles className="w-6 h-6 text-indigo-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-white">AI Global Summary</CardTitle>
                                    <CardDescription className="text-indigo-200/60">Análisis de salud del negocio en tiempo real</CardDescription>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRefresh}
                                disabled={isRegenerating}
                                className="bg-zinc-900/50 border-white/10 hover:bg-white/5"
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${isRegenerating ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-lg text-indigo-100 leading-relaxed font-light">
                            {data?.summary}
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Customer Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data?.customers.map((customer, index) => (
                    <motion.div
                        key={customer.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <Card className="bg-zinc-900/50 border-white/5 hover:border-white/10 transition-colors h-full flex flex-col">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="outline" className={`${getStatusColor(customer.status)} flex items-center gap-1`}>
                                        {getStatusIcon(customer.status)}
                                        {customer.status}
                                    </Badge>
                                    <span className="text-xs text-zinc-500 font-mono">
                                        {customer.lastVisitDays}d sin visita
                                    </span>
                                </div>
                                <CardTitle className="text-lg text-white truncate">{customer.name}</CardTitle>
                                <div className="text-sm text-zinc-400 flex items-center gap-2">
                                    <span className="text-amber-500 font-bold">{customer.points} pts</span>
                                    <span>•</span>
                                    <span>{customer.phone}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-grow flex flex-col justify-between gap-4">
                                <div className="p-3 bg-zinc-950/50 rounded-lg border border-white/5">
                                    <p className="text-sm text-zinc-300 italic">&quot;{customer.message}&quot;</p>
                                </div>
                                <Button 
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"
                                    onClick={() => handleSendWhatsapp(customer.phone, customer.message)}
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Enviar WhatsApp
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
