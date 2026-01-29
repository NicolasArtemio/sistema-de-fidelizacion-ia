import { Star, User, Gift } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import PointActions from '@/components/admin/PointActions'
import { Profile } from '@/types'

interface ClientMobileCardProps {
    profile: Profile
    refreshTrigger: number
    onAddPoints: (profile: Profile, points: number) => void
    onOpenRedeem: (profile: Profile) => void
}

export default function ClientMobileCard({ 
    profile, 
    refreshTrigger, 
    onAddPoints, 
    onOpenRedeem 
}: ClientMobileCardProps) {
    return (
        <div className="flex flex-col w-full max-w-full box-border bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg p-3 mb-3">
            <div className="min-w-0 w-full">
                {/* Header: Avatar, Name, Badge Vertical Stack */}
                <div className="flex items-start justify-between w-full mb-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-white/10 flex-shrink-0">
                            {profile.avatar_url ? (
                                <img 
                                    src={`${profile.avatar_url}?t=${refreshTrigger}`} 
                                    alt={profile.full_name} 
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold border border-amber-500/20">
                                    {profile.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                </div>
                            )}
                        </div>
                        
                        {/* Name & Phone Stack */}
                        <div className="flex flex-col min-w-0">
                            <div className="font-bold text-base text-white truncate max-w-[150px]">
                                {profile.full_name || 'Sin Nombre'}
                            </div>
                            <div className="text-xs text-zinc-500 font-mono truncate">
                                {profile.whatsapp}
                            </div>
                        </div>
                    </div>

                    {/* Admin Badge (Absolute Top Right or Flex) */}
                    {profile.role === 'admin' && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-500 rounded border border-zinc-700/50 uppercase tracking-wider shrink-0 ml-2">
                            ADMIN
                        </span>
                    )}
                </div>

                {/* Points Row */}
                <div className="w-full mb-3">
                     <div className={cn(
                        "flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold w-full",
                        profile.points >= 10 
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_-3px_rgba(245,158,11,0.2)]" 
                            : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50"
                    )}>
                        <Star className="w-4 h-4 fill-current" />
                        <span>{profile.points} Puntos</span>
                    </div>
                </div>

                {/* Actions Grid */}
                <div className="grid grid-cols-2 gap-2 w-full">
                    {/* Quick Add Button */}
                    <div className="w-full h-10">
                        <PointActions 
                            onAddPoints={(points) => onAddPoints(profile, points)} 
                            className="w-full h-full"
                        />
                    </div>

                    {/* Canjes Button */}
                    <div className="w-full h-10">
                        <Button
                            className="w-full h-full bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)] rounded-lg active:scale-95 transition-all border border-amber-400/50 text-sm"
                            onClick={() => onOpenRedeem(profile)}
                        >
                            <Gift className="w-4 h-4 mr-2" />
                            Canjear
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
