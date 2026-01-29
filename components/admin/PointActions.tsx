'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Plus, ChevronDown, Scissors, Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface PointActionsProps {
    onAddPoints: (points: number) => void
    className?: string
}

export default function PointActions({ onAddPoints, className }: PointActionsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleSelect = (points: number) => {
        onAddPoints(points)
        setIsOpen(false)
    }

    const options = [
        { points: 120, label: 'Corte', icon: Scissors, color: 'emerald' },
        { points: 150, label: 'Corte + Barba', icon: Sparkles, color: 'orange' },
        { points: 40, label: 'Perfilado', icon: Scissors, color: 'zinc' },
    ]

    return (
        <div className={cn("relative", className)}>
            <Button
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full h-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2 rounded-lg shadow-sm border border-emerald-500/50 transition-all active:scale-95 text-sm"
            >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                <span className="hidden sm:inline">Sumar Puntos</span>
                <span className="sm:hidden">Sumar</span>
                <ChevronDown className={`w-3 h-3 ml-1.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* MOBILE DRAWER (Portal) */}
                        {mounted && createPortal(
                            <div className="fixed inset-0 z-[100] flex items-end justify-center md:hidden">
                                {/* Backdrop */}
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }} 
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                                    onClick={() => setIsOpen(false)}
                                />
                                
                                {/* Drawer Content */}
                                <motion.div
                                    initial={{ y: "100%" }}
                                    animate={{ y: 0 }}
                                    exit={{ y: "100%" }}
                                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                    className="relative w-full bg-zinc-900 border-t border-white/10 rounded-t-2xl p-4 pb-8 shadow-2xl ring-1 ring-white/10"
                                    drag="y"
                                    dragConstraints={{ top: 0 }}
                                    dragElastic={0.2}
                                    onDragEnd={(_, info) => {
                                        if (info.offset.y > 100) setIsOpen(false)
                                    }}
                                >
                                    {/* Handle bar */}
                                    <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-6" />
                                    
                                    <div className="flex items-center justify-between mb-4 px-2">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Plus className="w-5 h-5 text-emerald-500" />
                                            Sumar Puntos
                                        </h3>
                                        <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 rounded-full bg-zinc-800 text-zinc-400">
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-3">
                                        {options.map((opt) => (
                                            <button
                                                key={opt.points}
                                                onClick={() => handleSelect(opt.points)}
                                                className="w-full flex items-center gap-4 px-4 py-4 text-left bg-zinc-800/50 hover:bg-zinc-800 border border-white/5 rounded-xl transition-all active:scale-[0.98] group"
                                            >
                                                <div className={`p-3 rounded-full ${
                                                    opt.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    opt.color === 'orange' ? 'bg-orange-500/10 text-orange-500' :
                                                    'bg-zinc-500/10 text-zinc-400'
                                                }`}>
                                                    <opt.icon className="w-6 h-6" />
                                                </div>
                                                <div className="flex flex-col flex-1">
                                                    <span className="font-bold text-base text-white group-hover:text-emerald-400 transition-colors">{opt.label}</span>
                                                    <span className="text-xs text-zinc-400">Servicio estándar</span>
                                                </div>
                                                <div className="px-3 py-1.5 rounded-lg bg-black/20 border border-white/5 font-mono font-bold text-emerald-500 text-lg">
                                                    +{opt.points}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>,
                            document.body
                        )}

                        {/* DESKTOP DROPDOWN (Absolute) */}
                        <div className="hidden md:block">
                            <div 
                                className="fixed inset-0 z-40" 
                                onClick={() => setIsOpen(false)}
                            />
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.1 }}
                                className="absolute top-full right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl z-50 overflow-hidden"
                            >
                                <div className="p-1 space-y-1">
                                    {options.map((opt) => (
                                        <button
                                            key={opt.points}
                                            onClick={() => handleSelect(opt.points)}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-500 rounded-lg transition-colors group text-left"
                                        >
                                            <div className={`p-1.5 rounded-md transition-colors ${
                                                opt.color === 'emerald' ? 'bg-zinc-800 group-hover:bg-emerald-500/20' :
                                                opt.color === 'orange' ? 'bg-zinc-800 group-hover:bg-orange-500/20' :
                                                'bg-zinc-800 group-hover:bg-zinc-100/20'
                                            }`}>
                                                <opt.icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold">{opt.label}</span>
                                                <span className={`text-[10px] text-zinc-500 ${
                                                    opt.color === 'emerald' ? 'group-hover:text-emerald-500/70' :
                                                    opt.color === 'orange' ? 'group-hover:text-orange-500/70' :
                                                    'group-hover:text-zinc-100/70'
                                                }`}>+{opt.points} pts</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </>
                )}
            </AnimatePresence>
        </div>
    )
}
