import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { Coffee, Scissors, Sparkles } from 'lucide-react'
import { Profile } from '@/types'

interface SelectionModalProps {
    isOpen: boolean
    onClose: () => void
    profile: Profile | null
    onSelect: (amount: number, reward: string) => void
}

export default function SelectionModal({ isOpen, onClose, profile, onSelect }: SelectionModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Seleccionar Recompensa"
            message={`¿Qué desea canjear ${profile?.full_name || 'el cliente'}?`}
            type="redeem"
            hideButtons
        >
            <div className="grid grid-cols-1 gap-3 pt-2">
                <Button
                    variant="outline"
                    className="h-16 justify-between px-4 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500/50 group"
                    disabled={(profile?.points || 0) < 600}
                    onClick={() => onSelect(600, 'Bebida / Snack')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                            <Coffee className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="font-bold text-white">Bebida / Snack</span>
                            <span className="text-xs text-zinc-400">Refresco o snack a elección</span>
                        </div>
                    </div>
                    <span className="font-bold text-amber-500">600 pts</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-16 justify-between px-4 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500/50 group"
                    disabled={(profile?.points || 0) < 900}
                    onClick={() => onSelect(900, 'Perfilado de Barba')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                            <Scissors className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="font-bold text-white">Perfilado de Barba</span>
                            <span className="text-xs text-zinc-400">Alineación y cuidado</span>
                        </div>
                    </div>
                    <span className="font-bold text-amber-500">900 pts</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-16 justify-between px-4 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500/50 group"
                    disabled={(profile?.points || 0) < 1200}
                    onClick={() => onSelect(1200, 'Corte de Pelo')}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                            <Scissors className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="font-bold text-white">Corte de Pelo</span>
                            <span className="text-xs text-zinc-400">Corte completo</span>
                        </div>
                    </div>
                    <span className="font-bold text-amber-500">1.200 pts</span>
                </Button>

                <Button
                    variant="outline"
                    className="h-16 justify-between px-4 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500/50 group"
                    disabled={(profile?.points || 0) < 1600}
                    onClick={() => onSelect(1600, 'Corte y Barba')}
                >
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="flex flex-col items-start text-left">
                            <span className="font-bold text-white">Corte y Barba</span>
                            <span className="text-xs text-zinc-400">Servicio completo</span>
                        </div>
                    </div>
                    <span className="font-bold text-amber-500">1.600 pts</span>
                </Button>
            </div>
        </Modal>
    )
}
