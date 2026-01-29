import { Modal } from '@/components/ui/Modal'
import { Trophy, Check, Lightbulb, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Profile } from '@/types'
import { POINTS_FOR_FREE_CUT } from '@/lib/constants'

interface AdjustPointsModalProps {
    isOpen: boolean
    onClose: () => void
    selectedProfile: Profile | null
    pointsToAdjust: number
    onConfirm: () => void
    isProcessing: boolean
    showSuccessAnimation: boolean
    refreshTrigger: number
}

export default function AdjustPointsModal({
    isOpen,
    onClose,
    selectedProfile,
    pointsToAdjust,
    onConfirm,
    isProcessing,
    showSuccessAnimation,
    refreshTrigger
}: AdjustPointsModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            type="confirm"
            title={showSuccessAnimation ? "¡Todo listo!" : "¡Sumar Recompensas!"}
            message={showSuccessAnimation ? "" : `¿Cuántos puntos querés ${pointsToAdjust >= 0 ? 'sumar a' : 'descontar a'} ${selectedProfile?.full_name}?`}
            confirmText={pointsToAdjust >= 0 ? "¡Otorgar Puntos!" : "Descontar Puntos"}
            onConfirm={onConfirm}
            isLoading={isProcessing}
            hideButtons={showSuccessAnimation}
            icon={<Trophy className="w-8 h-8 text-[#FFD700]" />}
        >
            <AnimatePresence mode="wait">
                {showSuccessAnimation ? (
                    <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex flex-col items-center justify-center p-6 space-y-4"
                    >
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-2">
                            <Check className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white">¡Puntos Actualizados!</h3>
                        
                        {/* AI Bubble Tip */}
                        {selectedProfile && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5 }}
                                className="mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl relative max-w-xs"
                            >
                                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-950/80 border-t border-l border-indigo-500/20 transform rotate-45"></div>
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-indigo-500/20 rounded-full flex-shrink-0 mt-0.5">
                                        <Lightbulb className="w-4 h-4 text-indigo-400" />
                                    </div>
                                    <div className="text-xs text-indigo-200 text-left leading-relaxed">
                                        <span className="font-semibold text-indigo-400 block mb-0.5">Tulook AI Tip:</span>
                                        {(() => {
                                            const currentPoints = selectedProfile.points + pointsToAdjust;
                                            const remaining = POINTS_FOR_FREE_CUT - currentPoints;
                                            
                                            if (remaining <= 0) {
                                                return `¡${selectedProfile.full_name.split(' ')[0]} ya tiene suficientes puntos para un corte gratis!`;
                                            } else {
                                                return `¡Solo faltan ${remaining} puntos para un corte gratis!`;
                                            }
                                        })()}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                ) : (
                    selectedProfile && (
                        <motion.div
                            key="confirm"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6 py-4"
                        >
                            <div className="flex justify-center mb-6">
                                <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-4 border-zinc-900 shadow-xl relative">
                                    {selectedProfile.avatar_url ? (
                                        <img 
                                            src={`${selectedProfile.avatar_url}?t=${refreshTrigger}`} 
                                            alt={selectedProfile.full_name} 
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-3xl border border-amber-500/20">
                                            {selectedProfile.full_name?.charAt(0).toUpperCase() || <User className="w-10 h-10" />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/10 text-center">
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">Puntos Actuales</p>
                                <p className="text-2xl font-bold text-amber-500">
                                    {selectedProfile.points}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex flex-col items-center justify-center p-4 bg-background/50 rounded-lg border border-white/5">
                                    <span className="text-sm text-muted-foreground uppercase tracking-wider mb-2">
                                        {pointsToAdjust >= 0 ? 'Puntos a sumar' : 'Puntos a descontar'}
                                    </span>
                                    <span className={`text-5xl font-black ${pointsToAdjust >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {pointsToAdjust > 0 ? '+' : ''}{pointsToAdjust}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )
                )}
            </AnimatePresence>
        </Modal>
    )
}
