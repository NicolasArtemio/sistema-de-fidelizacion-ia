// components/loyalty/GameRules.tsx
'use client'

import { motion } from 'framer-motion'
import { Coffee, Shirt, Scissors, Users, Gift, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GameRules() {
    const rewards = [
        {
            points: 5,
            icon: Coffee,
            title: "Bebida",
            desc: "Coca, Sprite o Speed",
            color: "text-amber-400"
        },
        {
            points: 10,
            icon: Shirt,
            title: "20% OFF",
            desc: "En Indumentaria",
            color: "text-amber-500"
        },
        {
            points: 15,
            icon: Scissors,
            title: "Corte Gratis",
            desc: "Tu estilo, nuestra cuenta",
            color: "text-amber-600"
        }
    ]

    return (
        <section className="space-y-6">
            <div className="text-center space-y-2">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Reglas & Recompensas
                    <Sparkles className="w-4 h-4 text-amber-500" />
                </h3>
            </div>

            {/* Rewards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {rewards.map((reward, i) => (
                    <motion.div
                        key={reward.points}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="relative group p-4 rounded-xl bg-neutral-900/50 border border-amber-500/20 backdrop-blur-sm overflow-hidden"
                    >
                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        
                        <div className="relative z-10 flex flex-col items-center text-center space-y-2">
                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-1">
                                <reward.icon className={cn("w-5 h-5", reward.color)} />
                            </div>
                            
                            <div>
                                <span className={cn("block text-2xl font-black leading-none", reward.color)}>
                                    {reward.points}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">
                                    Puntos
                                </span>
                            </div>

                            <div className="space-y-0.5">
                                <h4 className="text-sm font-bold text-zinc-200">
                                    {reward.title}
                                </h4>
                                <p className="text-xs text-zinc-400 leading-tight">
                                    {reward.desc}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Special Rule Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="relative p-5 rounded-xl bg-gradient-to-r from-amber-950/40 to-neutral-900/40 border border-amber-500/30 overflow-hidden"
            >
                <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Users className="w-24 h-24 text-amber-500" />
                </div>

                <div className="relative z-10 flex items-start gap-4">
                    <div className="p-3 rounded-full bg-amber-500/20 border border-amber-500/30 shrink-0">
                        <Users className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <h4 className="font-bold text-amber-100 text-sm uppercase tracking-wide">
                                Bonus de Amigo
                            </h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black">
                                +1 PT
                            </span>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            ¿Venís con un amigo nuevo? <br/>
                            <span className="text-amber-400 font-medium">¡Te regalamos 1 punto extra!</span>
                            <br />
                            <span className="text-xs text-zinc-500 italic mt-1 block">
                                *Válido para la primera visita de tu amigo.
                            </span>
                        </p>
                    </div>
                </div>
            </motion.div>
        </section>
    )
}
