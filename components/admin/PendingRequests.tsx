import { Bell, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RedemptionRequest } from '@/types'

interface PendingRequestsProps {
    requests: RedemptionRequest[]
    isProcessing: boolean
    onProcess: (requestId: string, approved: boolean) => void
}

export default function PendingRequests({ requests, isProcessing, onProcess }: PendingRequestsProps) {
    if (requests.length === 0) return null

    return (
        <div className="mb-6 p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl animate-in slide-in-from-top-2">
            <h3 className="text-lg font-bold text-amber-500 mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5 animate-pulse" />
                Solicitudes de Canje ({requests.length})
            </h3>
            <div className="grid gap-3">
                {requests.map(req => (
                    <div key={req.id} className="flex flex-col md:flex-row items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-xl border border-white/5 shadow-sm">
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-amber-500 border border-amber-500/20 shrink-0">
                                {req.profiles?.full_name?.charAt(0)}
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm md:text-base">{req.profiles?.full_name}</div>
                                <div className="text-xs md:text-sm text-zinc-400">
                                    Quiere canjear: <span className="text-amber-500 font-bold">{req.reward_name}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right mr-2">
                                <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Costo</div>
                                <div className="font-bold text-amber-500 text-sm">-{req.cost.toLocaleString()} pts</div>
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    size="sm" 
                                    className="h-9 bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 font-bold"
                                    onClick={() => onProcess(req.id, true)}
                                    disabled={isProcessing}
                                >
                                    <Check className="w-4 h-4 mr-1.5" />
                                    Aprobar
                                </Button>
                                <Button 
                                    size="sm" 
                                    className="h-9 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 font-bold"
                                    onClick={() => onProcess(req.id, false)}
                                    disabled={isProcessing}
                                >
                                    Rechazar
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
