'use client'

import { useEffect, useState } from 'react'
import { Trophy, Share2, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'

interface WinnerBadgeProps {
  winnerName: string
}

export default function WinnerBadge({ winnerName }: WinnerBadgeProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    
    // Confetti Logic: Run only once per month
    const currentDate = new Date()
    const currentMonthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`
    const storageKey = `winner_confetti_shown_${currentMonthKey}`
    
    const hasSeenConfetti = localStorage.getItem(storageKey)

    if (!hasSeenConfetti) {
      // Fire Confetti
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FFFFFF']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }

      frame()
      
      // Mark as seen
      localStorage.setItem(storageKey, 'true')
    }
  }, [])

  const handleShare = async () => {
    const shareData = {
      title: '¡Ganador del Mes!',
      text: `¡Soy el GANADOR del mes en tulook! 🏆 Gracias a mis puntos me gané un premio. ¡Sumate al club! 🔥`,
      url: window.location.origin // Or a specific landing page
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`)
      alert('¡Texto copiado al portapapeles!')
    }
  }

  if (!hasMounted) return null

  return (
    <section className="animate-in fade-in slide-in-from-top-4 duration-1000 mb-6">
      <div className="relative overflow-hidden rounded-xl border border-gold-500/50 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-900/20 p-6 text-center shadow-[0_0_40px_rgba(255,191,0,0.15)] group">
        
        {/* Animated Background Noise */}
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
        
        {/* Shimmer Effect overlay */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"></div>

        <div className="relative z-10 flex flex-col items-center gap-3">
          
          {/* Trophy with Glaze Animation */}
          <div className="relative p-4 rounded-full bg-gold-500/10 border border-gold-500/50 shadow-[0_0_25px_rgba(255,215,0,0.2)]">
             {/* Glaze/Swipe animation on the icon container */}
             <div className="absolute inset-0 rounded-full overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_infinite_linear]" />
             </div>
             <Trophy className="w-10 h-10 text-gold-400 drop-shadow-md" />
             <Sparkles className="absolute top-1 right-1 w-4 h-4 text-white animate-pulse" />
          </div>

          <h2 className="text-2xl font-bold uppercase text-white drop-shadow-md tracking-widest font-serif">
            ¡Ganador del Mes!
          </h2>
          
          <p className="text-sm font-medium text-gold-200/90 max-w-[280px] leading-relaxed">
            Felicitaciones {winnerName.split(' ')[0]}, fuiste el cliente #1 el mes pasado.
          </p>

          <Button 
            onClick={handleShare}
            className="mt-2 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 text-black font-bold border-none hover:opacity-90 transition-all shadow-[0_0_15px_rgba(255,191,0,0.4)] animate-bounce-slow"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartir Logro
          </Button>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        .animate-bounce-slow {
            animation: bounce 3s infinite;
        }
      `}</style>
    </section>
  )
}
