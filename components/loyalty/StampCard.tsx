'use client'

import { motion } from 'framer-motion'
import { Scissors, Shirt, Coffee, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StampCardProps {
    points: number
}

export default function StampCard({ points }: StampCardProps) {
    const totalSlots = 15

    const getIcon = (index: number) => {
        // 1-based index
        const slot = index + 1
        if (slot === 5) return Coffee
        if (slot === 10) return Shirt
        if (slot === 15) return Scissors // Or maybe a special Crown? Using Scissors as Main Reward
        return Scissors
    }

    const getRewardLabel = (index: number) => {
        const slot = index + 1
        if (slot === 5) return 'Bebida'
        if (slot === 10) return '20% Off'
        if (slot === 15) return 'Corte'
        return null
    }

    return (
        <div className="w-full max-w-sm mx-auto p-6 bg-neutral-900/80 backdrop-blur-xl rounded-xl border border-gold-500/50 shadow-[0_0_30px_rgba(212,175,55,0.15)] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-gold-500/10 rounded-full blur-3xl" />

            <div className="mb-8 text-center space-y-1">
                <h2 className="text-xl font-extrabold text-gold-500 uppercase tracking-[0.2em] drop-shadow-sm">VIP Membership</h2>
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest">Barber & Style Club</p>
            </div>

            <div className="grid grid-cols-5 gap-3 sm:gap-4 relative z-10">
                {Array.from({ length: totalSlots }).map((_, i) => {
                    const isFilled = i < points
                    const Icon = getIcon(i)
                    const isMilestone = (i + 1) % 5 === 0
                    const rewardLabel = getRewardLabel(i)

                    return (
                        <div key={i} className="flex flex-col items-center gap-2">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: isFilled ? '#D4AF37' : 'rgba(255,255,255,0.03)',
                                    scale: isFilled ? 1 : 0.9,
                                    borderColor: isFilled ? '#D4AF37' : 'rgba(255,255,255,0.1)',
                                    boxShadow: isFilled ? '0 0 15px rgba(255, 191, 0, 0.6)' : 'none',
                                }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={cn(
                                    "w-10 h-10 sm:w-12 sm:h-12 rounded-full border flex items-center justify-center relative z-10",
                                    !isFilled && "opacity-60 border-dashed"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "w-5 h-5 sm:w-6 sm:h-6 transition-colors duration-300",
                                        isFilled ? "text-black" : "text-zinc-600"
                                    )}
                                />

                                {isMilestone && !isFilled && (
                                    <div className="absolute -top-1 -right-1">
                                        <Star className="w-3 h-3 text-gold-500 fill-gold-500 animate-pulse" />
                                    </div>
                                )}
                            </motion.div>

                            {rewardLabel && (
                                <span className={cn(
                                    "text-[0.6rem] font-extrabold uppercase tracking-tighter text-center leading-none",
                                    isFilled ? "text-gold-500 drop-shadow-[0_0_5px_rgba(212,175,55,0.5)]" : "text-zinc-600"
                                )}>
                                    {rewardLabel}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="mt-8 flex justify-between items-end text-sm border-t border-gold-500/20 pt-4">
                <span className="text-zinc-500 font-medium uppercase tracking-widest text-xs">Saldo Actual</span>
                <span className="font-black text-3xl text-gold-500 leading-none drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]">{points}</span>
            </div>
        </div>
    )
}
