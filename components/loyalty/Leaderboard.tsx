import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LeaderboardEntry {
  id: string
  full_name: string
  points: number
}

interface LeaderboardProps {
  top: LeaderboardEntry[]
  currentUserId: string
  userRank: number
}

function formatName(fullName: string): string {
  const parts = (fullName || '').trim().split(/\s+/)
  const first = parts[0] || ''
  const lastInitial = parts[1] ? parts[1].charAt(0) + '.' : ''
  return lastInitial ? `${first} ${lastInitial}` : first
}

export default function Leaderboard({ top, currentUserId, userRank }: LeaderboardProps) {
  const isInTop = top.some(t => t.id === currentUserId)
  
  // Dynamic Month in Spanish (e.g., "Enero")
  const currentMonth = new Intl.DateTimeFormat('es-ES', { month: 'long' }).format(new Date())
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1)

  return (
    <div className="w-full max-w-md mx-auto bg-neutral-900/80 backdrop-blur-xl rounded-xl border border-gold-500/30 shadow-[0_0_30px_rgba(212,175,55,0.12)]">
      <div className="px-4 py-4 border-b border-gold-500/10">
        <h3 className="text-lg font-extrabold text-gold-500 uppercase tracking-widest text-center drop-shadow-sm font-serif">
          Top 5: Edición {capitalizedMonth} ✨
        </h3>
        <p className="text-[10px] text-center text-zinc-500 uppercase tracking-[0.2em] mt-1">
          Hall of Fame
        </p>
      </div>
      <ul className="divide-y divide-gold-500/10">
        {top.map((entry, idx) => {
          const highlight = entry.id === currentUserId
          return (
            <li key={entry.id} className={cn(
              'flex items-center justify-between px-4 py-3',
              highlight ? 'bg-neutral-800/60' : 'bg-transparent'
            )}>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'w-7 h-7 shrink-0 rounded-full border border-gold-500/40 flex items-center justify-center text-xs font-black',
                  idx === 0 ? 'bg-gold-500 text-black' : 'text-gold-500'
                )}>
                  {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  {idx === 0 && <Crown className="w-4 h-4 text-gold-500" />}
                  <span className={cn('text-sm font-semibold', highlight ? 'text-gold-500' : 'text-zinc-300')}>{formatName(entry.full_name)}</span>
                </div>
              </div>
              <span className="text-sm font-extrabold text-gold-500">{entry.points}</span>
            </li>
          )
        })}
      </ul>
      {!isInTop && (
        <div className="px-4 py-3 border-t border-gold-500/10 text-center">
          <p className="text-xs text-zinc-400">You are currently #{userRank} in the ranking</p>
        </div>
      )}
    </div>
  )
}

