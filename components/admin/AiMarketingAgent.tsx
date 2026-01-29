'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
    Sparkles, 
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
import { createClient } from '@/lib/supabase/client'
import { generateMarketingInsights, MarketingInsight, regenerateClientMessage, getLatestCustomerData } from '@/app/ai-actions'
import { toast } from 'sonner'

interface CustomerMarketingCardProps {
    customer: MarketingInsight['customers'][0];
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
}

function CustomerMarketingCard({ customer, getStatusColor, getStatusIcon }: CustomerMarketingCardProps) {
    const [message, setMessage] = useState(customer.message);
    const [points, setPoints] = useState(customer.points);
    const [status, setStatus] = useState(customer.status);
    const [isRegenerating, setIsRegenerating] = useState(false);

    // Update local state if prop changes (e.g. global refresh or realtime update)
    useEffect(() => {
        setMessage(customer.message);
        setPoints(customer.points);
        setStatus(customer.status);
    }, [customer]);

    // Fetch latest data on mount to ensure freshness (fixes sync bugs)
    useEffect(() => {
        const fetchLatest = async () => {
            try {
                const latest = await getLatestCustomerData(customer.id);
                if (latest && latest.points !== points) {
                    console.log(`🔄 Syncing data for ${customer.name}: ${points} -> ${latest.points}`);
                    setPoints(latest.points);
                    // Only update status if points changed significantly
                    if (latest.status !== status) setStatus(latest.status);
                }
            } catch (error) {
                console.error('Error syncing customer data:', error);
            }
        };
        fetchLatest();
    }, []); // Run once on mount

    const handleRegenerate = async () => {
        setIsRegenerating(true);
        try {
            const result = await regenerateClientMessage(
                customer.id, 
                message
            );
            setMessage(result.message);
            setPoints(result.points);
            setStatus(result.status);
            toast.success('Mensaje regenerado con éxito');
        } catch (error) {
            console.error(error);
            toast.error('Error al regenerar el mensaje');
        } finally {
            setIsRegenerating(false);
        }
    };

    const handleSendWhatsapp = () => {
        const url = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    };

    return (
        <Card className="bg-zinc-900/80 backdrop-blur-md border-white/10 hover:border-white/20 transition-colors h-full flex flex-col group">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className={`${getStatusColor(status)} flex items-center gap-1`}>
                        {getStatusIcon(status)}
                        {status}
                    </Badge>
                    <span className="text-xs text-zinc-500 font-mono">
                        {customer.lastVisitDays}d sin visita
                    </span>
                </div>
                <CardTitle className="text-lg text-white truncate">{customer.name}</CardTitle>
                <div className="text-sm text-zinc-400 flex items-center gap-2">
                    <span className="text-amber-500 font-bold">{points} pts</span>
                    <span>•</span>
                    <span>{customer.phone}</span>
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col gap-3">
                <div className="relative flex-grow">
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="w-full h-32 bg-zinc-950/50 text-zinc-300 text-sm p-3 rounded-lg border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 resize-none outline-none transition-all font-sans leading-relaxed"
                        placeholder="Escribe un mensaje..."
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                        className="absolute bottom-2 right-2 h-8 w-8 bg-zinc-800/80 hover:bg-indigo-500/20 hover:text-indigo-400 rounded-md backdrop-blur-sm transition-all"
                        title="Regenerar mensaje con IA"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
                
                <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all active:scale-[0.98]"
                    onClick={handleSendWhatsapp}
                >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar WhatsApp
                </Button>
            </CardContent>
        </Card>
    );
}

export default function AiMarketingAgent() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<MarketingInsight | null>(null)
    const [isRegenerating, setIsRegenerating] = useState(false)
    const supabase = createClient()

    const fetchInsights = async () => {
        try {
            // Don't set loading to true for background refreshes unless data is null
            if (!data) setLoading(true)
            
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

        // Realtime subscription for immediate point updates
        const channel = supabase
            .channel('ai-marketing-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    const newProfile = payload.new as any;
                    console.log('🔔 AI Agent Realtime Update:', newProfile);
                    
                    setData(currentData => {
                        if (!currentData) return null;
                        
                        return {
                            ...currentData,
                            customers: currentData.customers.map(c => {
                                if (c.id === newProfile.id) {
                                    // Update points immediately
                                    return {
                                        ...c,
                                        points: newProfile.points,
                                        // Update status logic simplified for client-side
                                        status: newProfile.points >= 600 ? 'Loyal' : c.status
                                    };
                                }
                                return c;
                            })
                        };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [])

    const handleRefresh = () => {
        setIsRegenerating(true)
        fetchInsights()
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
                <p className="text-zinc-400 animate-pulse">Analizando clientes...</p>
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
                                    <CardTitle className="text-xl text-white">Resumen Global IA</CardTitle>
                                    <CardDescription className="text-indigo-200/60">Salud del negocio en tiempo real</CardDescription>
                                </div>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleRefresh}
                                disabled={isRegenerating}
                                className="bg-zinc-900/50 border-white/10 hover:bg-white/5 min-w-[120px]"
                            >
                                {isRegenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-400" />
                                        Analizando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Iniciar Análisis
                                    </>
                                )}
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
                        <CustomerMarketingCard 
                            customer={customer}
                            getStatusColor={getStatusColor}
                            getStatusIcon={getStatusIcon}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
