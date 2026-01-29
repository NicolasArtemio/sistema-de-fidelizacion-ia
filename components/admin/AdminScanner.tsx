'use client'

import { useEffect, useState } from 'react'
import QRScanner from '@/components/QRScanner'
import { Modal } from '@/components/ui/Modal'
import { adjustPoints } from '@/app/server-actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'

export default function AdminScanner() {
    const [hasMounted, setHasMounted] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [scannedUser, setScannedUser] = useState<{ id: string, name: string, points: number } | null>(null)
    const [pointsToAdd, setPointsToAdd] = useState(1)
    const [confirmModalOpen, setConfirmModalOpen] = useState(false)
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)

    useEffect(() => {
        setHasMounted(true)
    }, [])

    if (!hasMounted) {
        return (
            <div className="w-full h-16 bg-zinc-800/50 rounded-lg border border-white/5 animate-pulse" suppressHydrationWarning />
        )
    }

    const handleScan = async (scannedText: string) => {
        setIsProcessing(true)
        try {
            // Standardize Data Flow: Treat as raw string
            const userId = scannedText.replace(/[^a-f0-9-]/gi, '').trim()

            console.log('🔍 [DEBUG] Raw Scanned:', scannedText)
            console.log('🔍 [DEBUG] Extracted ID:', userId)

            // UUID Validation
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
            if (!uuidRegex.test(userId)) {
                console.warn('❌ [SCANNER DEBUG] Invalid UUID format:', userId)
                toast.error('Código QR inválido: El ID no tiene el formato correcto')
                return
            }

            // 3. Haptic Feedback (Optional - kept for UX)
            if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(50)
            }

            // 4. Skip Client-Side Fetch (RLS Bypass)
            // We use a placeholder user and let the Server Action handle the logic
            setScannedUser({
                id: userId,
                name: 'Cliente Detectado',
                points: 0
            })
            setPointsToAdd(1)
            setConfirmModalOpen(true)

        } catch (err) {
            console.error(err)
            toast.error('Error al procesar el código')
        } finally {
            setIsProcessing(false)
        }
    }

    const handleConfirmPoints = async (e?: React.MouseEvent | React.FormEvent) => {
        // 1. Prevent Default & checks
        if (e && 'preventDefault' in e) e.preventDefault()
        if (isProcessing || !scannedUser) return

        // 2. Data Preparation
        const sanitizedId = scannedUser.id.trim()
        const numericPoints = Number(pointsToAdd)
        const finalPoints = isNaN(numericPoints) || numericPoints < 1 ? 1 : numericPoints

        console.log('🚀 [CLIENT] Adjusting points:', { sanitizedId, finalPoints })

        setIsProcessing(true)
        try {
            // 3. Call Server Action
            const res = await adjustPoints(sanitizedId, finalPoints)

            if (res?.error) {
                console.error('❌ [CLIENT] Server Error:', res.error)
                toast.error(typeof res.error === 'string' ? res.error : 'Error al sumar puntos')
                // Modal stays open because we don't call setConfirmModalOpen(false) here
            } else {
                console.log('✅ [CLIENT] Success:', res.message)
                setShowSuccessAnimation(true)

                // Close modal and cleanup after animation
                setTimeout(() => {
                    toast.success(`¡Puntos cargados con éxito!`)
                    setShowSuccessAnimation(false)
                    setConfirmModalOpen(false)
                    setScannedUser(null)
                    // Refresh if needed
                    window.location.reload()
                }, 2000)
            }
        } catch (err) {
            console.error('SYSTEM ERROR:', err)
            toast.error('Error crítico al procesar la solicitud')
        } finally {
            setIsProcessing(false) // This stops the loading spinner
        }
    }

    return (
        <>
            <QRScanner onScan={handleScan} isProcessing={isProcessing} />

            <Modal
                isOpen={confirmModalOpen}
                onClose={() => !showSuccessAnimation && !isProcessing && setConfirmModalOpen(false)}
                type="confirm"
                title={showSuccessAnimation ? "¡Todo listo!" : "Cliente Identificado"}
                message={showSuccessAnimation ? "" : `¿Confirmás ${pointsToAdd >= 0 ? 'sumar' : 'descontar'} ${Math.abs(pointsToAdd)} puntos a ${scannedUser?.name}?`}
                confirmText={pointsToAdd >= 0 ? "Cargar Puntos" : "Canjear Puntos"}
                onConfirm={handleConfirmPoints}
                isLoading={isProcessing}
                hideButtons={showSuccessAnimation}
            >
                <AnimatePresence mode="wait">
                    {showSuccessAnimation ? (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            className="flex flex-col items-center justify-center py-8 space-y-4"
                        >
                            <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center">
                                <motion.div
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 0.5, ease: "easeInOut" }}
                                >
                                    <Check className="w-12 h-12 text-green-500" strokeWidth={3} />
                                </motion.div>
                            </div>
                            <p className="text-xl font-bold text-green-500">¡Puntos cargados!</p>
                        </motion.div>
                    ) : (
                        scannedUser && (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="py-4 space-y-4"
                            >
                                <div className="p-3 bg-zinc-900/50 rounded-lg border border-white/10 text-center">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Puntos Actuales</p>
                                    <p className="text-2xl font-bold text-amber-500">
                                        {scannedUser.points < 0 ? '-' : scannedUser.points}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <Label className="text-center block text-emerald-400">Sumar Puntos (Servicio)</Label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { l: '120', v: 120 },
                                            { l: '150', v: 150 },
                                            { l: '40', v: 40 }
                                        ].map((opt) => (
                                            <Button
                                                key={`scan-add-${opt.v}`}
                                                variant={pointsToAdd === opt.v ? "default" : "outline"}
                                                className={`h-12 font-bold text-lg ${
                                                    pointsToAdd === opt.v 
                                                    ? "bg-emerald-500 text-white hover:bg-emerald-600" 
                                                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                }`}
                                                onClick={() => setPointsToAdd(opt.v)}
                                            >
                                                +{opt.l}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="pt-2 border-t border-white/10">
                                        <Label className="text-center block text-red-400 mb-2">Canjear (Premios)</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { l: '600', v: 600 },
                                                { l: '900', v: 900 },
                                                { l: '1200', v: 1200 },
                                                { l: '1600', v: 1600 }
                                            ].map((opt) => (
                                                <Button
                                                    key={`scan-sub-${opt.v}`}
                                                    variant={pointsToAdd === -opt.v ? "default" : "outline"}
                                                    className={`h-12 font-bold text-lg ${
                                                        pointsToAdd === -opt.v 
                                                        ? "bg-red-500 text-white hover:bg-red-600" 
                                                        : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                                                    }`}
                                                    onClick={() => setPointsToAdd(-opt.v)}
                                                    disabled={scannedUser.points < opt.v}
                                                >
                                                    -{opt.l}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    )}
                </AnimatePresence>
            </Modal>
        </>
    )
}
