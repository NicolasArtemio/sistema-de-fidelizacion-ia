import { Modal } from '@/components/ui/Modal'
import { Check, Gift } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile } from '@/types'

interface RedeemModalProps {
    isOpen: boolean
    onClose: () => void
    profile: Profile | null
    amount: number
    reward: string
    onConfirm: () => void
    isProcessing: boolean
    showSuccessAnimation: boolean
}

export default function RedeemModal({
    isOpen,
    onClose,
    profile,
    amount,
    reward,
    onConfirm,
    isProcessing,
    showSuccessAnimation
}: RedeemModalProps) {
    if (!profile) return null

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            type="redeem"
            title={showSuccessAnimation ? "¡Canje Exitoso!" : "Confirmar Canje"}
            message={showSuccessAnimation ? "" : `¿Confirmar el canje de ${amount} puntos por "${reward}" para ${profile.full_name}?`}
            confirmText="Confirmar Canje"
            onConfirm={onConfirm}
            isLoading={isProcessing}
            hideButtons={showSuccessAnimation}
        >
            <AnimatePresence mode="wait">
                {showSuccessAnimation ? (
                    <motion.div
                        key="success-redeem"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center justify-center py-8 space-y-4"
                    >
                        <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Check className="w-12 h-12 text-emerald-500" strokeWidth={3} />
                        </div>
                        <p className="text-xl font-bold text-emerald-500">¡Premio Entregado!</p>
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                            <div className="text-sm text-zinc-400 mb-1">Cliente</div>
                            <div className="text-lg font-semibold text-white">{profile.full_name}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-center">
                                <div className="text-sm text-zinc-400 mb-1">Puntos</div>
                                <div className="text-2xl font-bold text-primary">{profile.points}</div>
                            </div>
                            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                                <div className="text-sm text-zinc-400 mb-1">Costo</div>
                                <div className="text-2xl font-bold text-red-400">-{amount}</div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 text-center">
                            <div className="text-sm text-amber-400/80 mb-1">Premio</div>
                            <div className="text-lg font-bold text-amber-400 flex items-center justify-center gap-2">
                                <Gift className="w-5 h-5" />
                                {reward}
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </Modal>
    )
}
