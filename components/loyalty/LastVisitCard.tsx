// components/loyalty/LastVisitCard.tsx
'use client'

import { motion } from 'framer-motion'
import { Calendar, AlertCircle, Scissors, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LastVisitCardProps {
    lastVisitDate: string | null
}

export default function LastVisitCard({ lastVisitDate }: LastVisitCardProps) {
    const today = new Date()
    const lastVisit = lastVisitDate ? new Date(lastVisitDate) : null
    
    // Calculate days passed
    const daysPassed = lastVisit 
        ? Math.floor((today.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
        : 0

    const isOverdue = daysPassed > 20
    const formattedDate = lastVisit 
        ? new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(lastVisit)
        : 'N/A'

    // Barber's WhatsApp (Placeholder - Update with real number)
    const barberPhone = '5491112345678' 
    const bookingMessage = "Hola! Quiero reservar un turno para mi próximo corte."
    const whatsappLink = `https://wa.me/${barberPhone}?text=${encodeURIComponent(bookingMessage)}`

    if (!lastVisit) {
        // Fallback for new users
        return (
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-neutral-900/50 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 backdrop-blur-sm"
            >
                <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Scissors className="w-4 h-4 text-gold-500" />
                        ¡Bienvenido!
                    </h3>
                    <p className="text-xs text-zinc-400">
                        Reservá tu primer corte hoy.
                    </p>
                </div>
                <Button 
                    size="sm" 
                    className="bg-gold-500 hover:bg-gold-600 text-black font-bold h-8 text-xs"
                    onClick={() => window.open(whatsappLink, '_blank')}
                >
                    Reservar
                </Button>
            </motion.div>
        )
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                relative rounded-xl p-4 border backdrop-blur-sm overflow-hidden
                ${isOverdue 
                    ? 'bg-amber-950/30 border-amber-500/50' 
                    : 'bg-neutral-900/50 border-white/10'
                }
            `}
        >
            {/* Background Glow for Overdue */}
            {isOverdue && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            )}

            <div className="relative z-10 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 uppercase tracking-wide">
                            <Calendar className="w-3.5 h-3.5" />
                            Último corte
                        </div>
                        <p className="text-lg font-bold text-white">
                            {formattedDate}
                        </p>
                    </div>
                    
                    {isOverdue && (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            Retoque
                        </div>
                    )}
                </div>

                {isOverdue && (
                    <p className="text-sm text-amber-200/90 font-medium leading-tight">
                        ¡Ya es hora de un retoque! ✂️
                    </p>
                )}

                <Button 
                    className={`
                        w-full font-bold text-xs h-9 mt-1
                        ${isOverdue 
                            ? 'bg-amber-500 hover:bg-amber-400 text-black' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }
                    `}
                    onClick={() => window.open(whatsappLink, '_blank')}
                >
                    <Scissors className="w-3.5 h-3.5 mr-2" />
                    Reservar Turno
                    <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-70" />
                </Button>
            </div>
        </motion.div>
    )
}
