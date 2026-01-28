'use client'

import { motion } from 'framer-motion'
import { Scissors } from 'lucide-react'
import { useEffect, useState } from 'react'

interface BarberLoaderProps {
  text?: string
  fullScreen?: boolean
}

export default function BarberLoader({ 
  text = "Preparando tu estilo...", 
  fullScreen = true 
}: BarberLoaderProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Static Fallback for SSR/Initial Render (Prevents Hydration Mismatch)
  if (!mounted) {
    return (
      <div 
        className={fullScreen ? "fixed inset-0 z-50 flex items-center justify-center bg-zinc-950" : "flex items-center justify-center py-12"}
        suppressHydrationWarning={true}
      >
         <div className="flex flex-col items-center justify-center gap-8 p-6 w-full max-w-md mx-auto">
            <div className="relative z-10 bg-neutral-900 border border-amber-500/30 p-5 rounded-full shadow-2xl shadow-black/50">
                <Scissors className="w-10 h-10 text-amber-500" />
            </div>
            <p className="text-sm font-medium text-zinc-500 tracking-widest uppercase text-center">
                {text}
            </p>
         </div>
      </div>
    )
  }
  
  const content = (
    <div className="flex flex-col items-center justify-center gap-8 p-6 w-full max-w-md mx-auto">
      {/* Animated Icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
        <motion.div
          animate={{ 
            rotate: [0, 10, 0, -10, 0],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="relative z-10 bg-neutral-900 border border-amber-500/30 p-5 rounded-full shadow-2xl shadow-black/50"
        >
          <Scissors className="w-10 h-10 text-amber-500" />
        </motion.div>
      </div>

      {/* Skeleton Cards Area */}
      <div className="w-full space-y-4">
        {/* Last Visit Card Shape */}
        <div className="h-20 w-full bg-neutral-900/40 rounded-xl border border-white/5 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
        </div>
        
        {/* Points Card Shape */}
        <div className="h-40 w-full bg-neutral-900/40 rounded-xl border border-white/5 overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse delay-100" />
        </div>
      </div>

      {/* Micro-copy */}
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-sm font-medium text-zinc-500 tracking-widest uppercase text-center"
      >
        {text}
      </motion.p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950">
        {content}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-12">
        {content}
    </div>
  )
}
