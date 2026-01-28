'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Plus, Minus, Gift, Loader2, Sparkles, KeyRound, Check, Trophy, Lightbulb, Star, Scissors, Eye, Clock, Key } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

import { Modal, useModal } from '@/components/ui/Modal'
import BarberLoader from '@/components/ui/BarberLoader'
import { Label } from '@/components/ui/label'
import { adjustPoints, resetUserPin } from '@/app/server-actions'
import { cn } from '@/lib/utils'

import AdminHistory from '@/components/admin/AdminHistory'
import { Profile } from '@/types'

export default function ClientManagement() {
    const [hasMounted, setHasMounted] = useState(false)
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const supabase = createClient()

    useEffect(() => {
        setHasMounted(true)
    }, [])

    // Modal states
    const modal = useModal()
    const [redeemModal, setRedeemModal] = useState<{
        isOpen: boolean
        profile: Profile | null
        amount: number
        reward: string
    }>({
        isOpen: false,
        profile: null,
        amount: 0,
        reward: '',
    })

    const [selectionModal, setSelectionModal] = useState<{
        isOpen: boolean
        profile: Profile | null
    }>({
        isOpen: false,
        profile: null,
    })

    const [resetPinModal, setResetPinModal] = useState<{
        isOpen: boolean
        profile: Profile | null
        newPin: string
    }>({
        isOpen: false,
        profile: null,
        newPin: '',
    })

    const [successModal, setSuccessModal] = useState<{
        isOpen: boolean
        title: string
        message: string
        type: 'success' | 'error'
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success',
    })

    const [isProcessing, setIsProcessing] = useState(false)
    const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
    const [adjustModalOpen, setAdjustModalOpen] = useState(false)
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
    const [pointsToAdjust, setPointsToAdjust] = useState(1)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const [customPoints, setCustomPoints] = useState<Record<string, string>>({})

    const handleCustomPointsChange = (userId: string, value: string) => {
        setCustomPoints(prev => ({ ...prev, [userId]: value }))
    }

    const handleApplyCustomPoints = (profile: Profile) => {
        const amount = parseInt(customPoints[profile.id] || '0')
        if (!amount || isNaN(amount)) return
        handleOpenAdjustModal(profile, amount)
        setCustomPoints(prev => ({ ...prev, [profile.id]: '' }))
    }

    const fetchProfiles = async () => {
        // Don't set loading to true on background refreshes if we want smooth updates, 
        // but for now let's keep it simple or maybe only set loading if it's the first load?
        // logic: if (profiles.length === 0) setLoading(true)
        
        // Select all columns including monthly_points and total_points_accumulated
        let query = supabase
            .from('profiles')
            .select('*, monthly_points, total_points_accumulated')
            .order('points', { ascending: false })

        if (search) {
            query = query.or(`full_name.ilike.%${search}%,whatsapp.ilike.%${search}%`)
        }

        const { data, error } = await query
        if (error) {
            console.error('Error fetching profiles:', error)
            setSuccessModal({
                isOpen: true,
                title: 'Error al cargar',
                message: 'No se pudieron cargar los perfiles. Por favor intentá de nuevo.',
                type: 'error',
            })
        } else {
            setProfiles(data || [])
        }
        setLoading(false)
    }

    // Initial load and Search
    useEffect(() => {
        const timer = setTimeout(fetchProfiles, 500)
        return () => clearTimeout(timer)
    }, [search, refreshTrigger])

    // Realtime Subscription
    useEffect(() => {
        const channel = supabase
            .channel('realtime-profiles-admin')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'profiles',
                },
                (payload) => {
                    console.log('🔔 Realtime update:', payload)
                    setRefreshTrigger(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    const handleOpenAdjustModal = (profile: Profile, amount: number) => {
        setSelectedProfile(profile)
        setPointsToAdjust(amount)
        setAdjustModalOpen(true)
        setShowSuccessAnimation(false)
    }

    const handleConfirmAdjust = async () => {
        if (!selectedProfile || isProcessing) return

        setIsProcessing(true)
        try {
            const res = await adjustPoints(selectedProfile.id, pointsToAdjust)

            if (res?.error) {
                console.error('❌ Error Adjusting Points:', res.error)
                setSuccessModal({
                    isOpen: true,
                    title: 'Error',
                    message: typeof res.error === 'string' ? res.error : 'Error al ajustar puntos',
                    type: 'error',
                })
            } else {
                // Trigger Confetti
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#ffffff']
                })
                
                setShowSuccessAnimation(true)

                setTimeout(() => {
                    setShowSuccessAnimation(false)
                    setAdjustModalOpen(false)
                    setSelectedProfile(null)
                    fetchProfiles()
                }, 4000) // Increased duration to let user read the AI tip
            }
        } catch (e) {
            console.error('System Error:', e)
            setSuccessModal({
                isOpen: true,
                title: 'Error Crítico',
                message: 'Error de sistema al procesar la solicitud',
                type: 'error',
            })
        } finally {
            setIsProcessing(false)
        }
    }

    const handleRedeem = async () => {
        if (!redeemModal.profile || isProcessing) return

        setIsProcessing(true)
        try {
            const res = await adjustPoints(redeemModal.profile.id, -redeemModal.amount)

            if (res?.error) {
                setSuccessModal({
                    isOpen: true,
                    title: 'Error en Canje',
                    message: res.error,
                    type: 'error',
                })
            } else {
                setShowSuccessAnimation(true)
                setTimeout(() => {
                    setShowSuccessAnimation(false)
                    setRedeemModal(prev => ({ ...prev, isOpen: false, profile: null }))
                    fetchProfiles()
                }, 2000)
            }
        } catch (e) {
            console.error('Redeem Error:', e)
        } finally {
            setIsProcessing(false)
        }
    }

    const handleResetPin = async () => {
        if (!resetPinModal.profile || !resetPinModal.newPin) return
        if (resetPinModal.newPin.length < 4) {
            setSuccessModal({
                isOpen: true,
                title: 'Error',
                message: 'El PIN debe tener al menos 4 dígitos',
                type: 'error'
            })
            return
        }

        const res = await resetUserPin(resetPinModal.profile.id, resetPinModal.newPin)
        setResetPinModal({ isOpen: false, profile: null, newPin: '' })

        if (res?.error) {
            setSuccessModal({
                isOpen: true,
                title: 'Error',
                message: res.error,
                type: 'error'
            })
        } else {
            setSuccessModal({
                isOpen: true,
                title: 'PIN Actualizado',
                message: 'El PIN del usuario ha sido actualizado correctamente.',
                type: 'success'
            })
        }
    }

    const openRedeemModal = (profile: Profile, amount: number, reward: string) => {
        if (profile.points < amount) {
            setSuccessModal({
                isOpen: true,
                title: 'Puntos Insuficientes',
                message: `${profile.full_name} solo tiene ${profile.points} puntos. Se necesitan ${amount} para canjear.`,
                type: 'error',
            })
            return
        }
        setRedeemModal({
            isOpen: true,
            profile,
            amount,
            reward,
        })
    }

    if (!hasMounted) {
        return (
            <div className="w-full flex items-center justify-center py-12" suppressHydrationWarning>
                <BarberLoader text="Cargando panel..." />
            </div>
        )
    }

    return (
        <>
            <Card className="w-full bg-card border-white/5">
                <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Gestión de Clientes
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                            {profiles.length} cliente{profiles.length !== 1 ? 's' : ''}
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por Nombre o WhatsApp..."
                            className="pl-9 h-10 md:h-11 bg-zinc-800/50 border-zinc-700/50 focus:border-primary text-sm rounded-xl"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12">
                            <BarberLoader fullScreen={false} text="Sincronizando clientes..." />
                        </div>
                    ) : (
                        <>
                            {/* MOBILE VIEW (Strict Vertical Stack) */}
                            <div className="md:hidden flex flex-col gap-4 pb-24">
                                {profiles.map((profile) => (
                                    <div key={profile.id} className="flex flex-col w-full bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg p-4">
                                        {/* Line 1: Name and Points */}
                                        <div className="flex justify-between items-center w-full mb-1">
                                            <div className="font-bold text-lg text-white truncate mr-2 flex-1">
                                                {profile.full_name || 'Sin Nombre'}
                                            </div>
                                            <div className={cn(
                                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap shrink-0",
                                                profile.points >= 10 
                                                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_-2px_rgba(245,158,11,0.3)]" 
                                                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                            )}>
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                {profile.points}
                                            </div>
                                        </div>
                                        {/* Line 2: Phone and Badge */}
                                        <div className="flex justify-between items-center w-full mb-4">
                                            <div className="text-sm text-zinc-500 font-mono">
                                                {profile.whatsapp}
                                            </div>
                                            {profile.role === 'admin' && (
                                                <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-500 rounded border border-zinc-700/50 uppercase tracking-wider">
                                                    ADMIN
                                                </span>
                                            )}
                                        </div>
                                        {/* Actions Grid (Grid Cols 2) */}
                                        <div className="grid grid-cols-2 gap-3">
                                            <Button 
                                                size="lg"
                                                className="h-12 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all rounded-xl"
                                                onClick={() => handleOpenAdjustModal(profile, 5)}
                                            >
                                                <Plus className="w-6 h-6" />
                                            </Button>
                                            <Button 
                                                size="lg"
                                                className="h-12 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all rounded-xl"
                                                onClick={() => handleOpenAdjustModal(profile, -5)}
                                            >
                                                <Minus className="w-6 h-6" />
                                            </Button>
                                            <Button
                                                className="col-span-2 h-14 bg-amber-500 hover:bg-amber-600 text-black font-bold text-lg shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)] rounded-xl active:scale-95 transition-all border border-amber-400/50"
                                                onClick={() => setSelectionModal({ isOpen: true, profile })}
                                            >
                                                <Gift className="w-6 h-6 mr-2" />
                                                CANJEAR
                                            </Button>
                                            <div className="col-span-2 flex gap-2 h-12">
                                                <Input 
                                                    type="number" 
                                                    placeholder="Manual..." 
                                                    className="h-full bg-zinc-950/50 border-white/10 px-4 rounded-xl focus-visible:ring-0 focus-visible:border-amber-500/50 text-base flex-1"
                                                    value={customPoints[profile.id] || ''}
                                                    onChange={(e) => handleCustomPointsChange(profile.id, e.target.value)}
                                                />
                                                <Button 
                                                    variant="secondary" 
                                                    className="h-full px-6 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 active:scale-95 transition-all font-bold"
                                                    onClick={() => handleApplyCustomPoints(profile)}
                                                >
                                                    OK
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* DESKTOP VIEW (Table Layout) */}
                            <div className="hidden md:block w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-900/50">
                                <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-white/5 text-sm font-medium text-muted-foreground">
                                    <div className="col-span-4">Usuario</div>
                                    <div className="col-span-2 text-center">Gastables</div>
                                    <div className="col-span-2 text-center">Histórico</div>
                                    <div className="col-span-4 text-center">Acciones</div>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {profiles.map((profile) => (
                                        <div key={profile.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group">
                                            {/* User Info */}
                                            <div className="col-span-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="font-bold text-white truncate">
                                                        {profile.full_name || 'Sin Nombre'}
                                                    </div>
                                                    {profile.role === 'admin' && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-500 rounded border border-zinc-700/50 uppercase tracking-wider">
                                                            ADMIN
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-zinc-500 font-mono">
                                                    {profile.whatsapp}
                                                </div>
                                            </div>
                                            
                                            {/* Points */}
                                            <div className="col-span-2 flex justify-center">
                                                <div className={cn(
                                                    "flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap",
                                                    profile.points >= 10 
                                                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                                                        : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50"
                                                )}>
                                                    <Star className="w-3.5 h-3.5 fill-current" />
                                                    {profile.points}
                                                </div>
                                            </div>
                                            
                                            {/* History */}
                                            <div className="col-span-2 flex justify-center">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-blue-500/20 hover:text-blue-400 text-zinc-500">
                                                    <Clock className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            
                                            {/* Actions */}
                                            <div className="col-span-4 flex items-center justify-center gap-2">
                                                <Button 
                                                    size="icon" 
                                                    className="h-9 w-9 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-lg"
                                                    onClick={() => handleOpenAdjustModal(profile, 5)}
                                                >
                                                    <Plus className="w-5 h-5" />
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    className="h-9 w-9 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 rounded-lg"
                                                    onClick={() => handleOpenAdjustModal(profile, -5)}
                                                >
                                                    <Minus className="w-5 h-5" />
                                                </Button>
                                                <Button 
                                                    className="h-9 bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 rounded-lg shadow-sm"
                                                    onClick={() => setSelectionModal({ isOpen: true, profile })}
                                                >
                                                    <Gift className="w-4 h-4 mr-1.5" />
                                                    Canjear
                                                </Button>
                                                <div className="w-px h-6 bg-white/10 mx-1"></div>
                                                <div className="flex items-center gap-1">
                                                    <Input 
                                                        type="number" 
                                                        className="w-16 h-9 bg-zinc-950/50 border-white/10 px-2 text-center rounded-lg text-xs"
                                                        placeholder="±"
                                                        value={customPoints[profile.id] || ''}
                                                        onChange={(e) => handleCustomPointsChange(profile.id, e.target.value)}
                                                    />
                                                    <Button 
                                                        size="icon"
                                                        variant="ghost" 
                                                        className="h-9 w-9 hover:bg-white/10 text-zinc-400 rounded-lg"
                                                        onClick={() => handleApplyCustomPoints(profile)}
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {profiles.length === 0 && (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    <p>No se encontraron clientes.</p>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Manual Adjustment Modal */}
            <Modal
                isOpen={adjustModalOpen}
                onClose={() => !showSuccessAnimation && !isProcessing && setAdjustModalOpen(false)}
                type="confirm"
                title={showSuccessAnimation ? "¡Todo listo!" : "¡Sumar Recompensas!"}
                message={showSuccessAnimation ? "" : `¿Cuántos puntos querés ${pointsToAdjust >= 0 ? 'sumar a' : 'descontar a'} ${selectedProfile?.full_name}?`}
                confirmText={pointsToAdjust >= 0 ? "¡Otorgar Puntos!" : "Descontar Puntos"}
                onConfirm={handleConfirmAdjust}
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
                                                const target = 15;
                                                const remaining = target - currentPoints;
                                                
                                                if (remaining <= 0) {
                                                    return `¡${selectedProfile.full_name.split(' ')[0]} ya tiene suficientes puntos para un corte gratis!`;
                                                } else {
                                                    return `${selectedProfile.full_name.split(' ')[0]} está a solo ${remaining} visitas de un corte gratis.`;
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

            {/* Selection Modal */}
            <Modal
                isOpen={selectionModal.isOpen}
                onClose={() => setSelectionModal({ isOpen: false, profile: null })}
                title="Seleccionar Recompensa"
                message={`¿Qué desea canjear ${selectionModal.profile?.full_name || 'el cliente'}?`}
                type="redeem"
                hideButtons
            >
                <div className="grid grid-cols-1 gap-3 pt-2">
                    <Button
                        variant="outline"
                        className="h-16 justify-between px-4 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500/50 group"
                        disabled={(selectionModal.profile?.points || 0) < 5}
                        onClick={() => {
                            if (selectionModal.profile) {
                                openRedeemModal(selectionModal.profile, 5, 'Bebida')
                                setSelectionModal({ isOpen: false, profile: null })
                            }
                        }}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                <Gift className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-bold text-white">Canjear Bebida</span>
                                <span className="text-xs text-zinc-400">Cerveza, Gaseosa, etc.</span>
                            </div>
                        </div>
                        <span className="font-bold text-amber-500">5 pts</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-16 justify-between px-4 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500/50 group"
                        disabled={(selectionModal.profile?.points || 0) < 10}
                        onClick={() => {
                            if (selectionModal.profile) {
                                openRedeemModal(selectionModal.profile, 10, '20% Off Clothing')
                                setSelectionModal({ isOpen: false, profile: null })
                            }
                        }}
                    >
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                <Gift className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-bold text-white">Canjear Descuento</span>
                                <span className="text-xs text-zinc-400">20% en Indumentaria</span>
                            </div>
                        </div>
                        <span className="font-bold text-amber-500">10 pts</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="h-16 justify-between px-4 border-zinc-700 hover:bg-zinc-800 hover:border-amber-500/50 group"
                        disabled={(selectionModal.profile?.points || 0) < 15}
                        onClick={() => {
                            if (selectionModal.profile) {
                                openRedeemModal(selectionModal.profile, 15, 'Corte Gratis')
                                setSelectionModal({ isOpen: false, profile: null })
                            }
                        }}
                    >
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                                <Scissors className="w-4 h-4 text-amber-500" />
                            </div>
                            <div className="flex flex-col items-start text-left">
                                <span className="font-bold text-white">Corte Gratis</span>
                                <span className="text-xs text-zinc-400">Servicio completo sin cargo</span>
                            </div>
                        </div>
                        <span className="font-bold text-amber-500">15 pts</span>
                    </Button>
                </div>
            </Modal>

            {/* Redemption Modal */}
            {redeemModal.profile && (
                <div key="redeem-container">
                    <Modal
                        isOpen={redeemModal.isOpen}
                        onClose={() => !showSuccessAnimation && !isProcessing && setRedeemModal(prev => ({ ...prev, isOpen: false }))}
                        type="redeem"
                        title={showSuccessAnimation ? "¡Canje Exitoso!" : "Confirmar Canje"}
                        message={showSuccessAnimation ? "" : `¿Confirmar el canje de ${redeemModal.amount} puntos por "${redeemModal.reward}" para ${redeemModal.profile.full_name}?`}
                        confirmText="Confirmar Canje"
                        onConfirm={handleRedeem}
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
                                        <div className="text-lg font-semibold text-white">{redeemModal.profile.full_name}</div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 text-center">
                                            <div className="text-sm text-zinc-400 mb-1">Puntos</div>
                                            <div className="text-2xl font-bold text-primary">{redeemModal.profile.points}</div>
                                        </div>
                                        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-center">
                                            <div className="text-sm text-zinc-400 mb-1">Costo</div>
                                            <div className="text-2xl font-bold text-red-400">-{redeemModal.amount}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/20 text-center">
                                        <div className="text-sm text-amber-400/80 mb-1">Premio</div>
                                        <div className="text-lg font-bold text-amber-400 flex items-center justify-center gap-2">
                                            <Gift className="w-5 h-5" />
                                            {redeemModal.reward}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </AnimatePresence>
                    </Modal>
                </div>
            )}

            {/* Reset PIN Modal */}
            <Modal
                isOpen={resetPinModal.isOpen}
                onClose={() => setResetPinModal({ isOpen: false, profile: null, newPin: '' })}
                title="Restablecer PIN"
                message={`Ingresá el nuevo PIN para ${resetPinModal.profile?.full_name}`}
                confirmText="Guardar PIN"
                onConfirm={handleResetPin}
            >
                <div className="space-y-4">
                    <Input
                        type="number"
                        placeholder="Nuevo PIN (4 dígitos)"
                        value={resetPinModal.newPin}
                        onChange={(e) => setResetPinModal(prev => ({ ...prev, newPin: e.target.value }))}
                        className="text-center text-xl tracking-widest bg-zinc-800/50 border-zinc-700"
                        maxLength={4}
                    />
                </div>
            </Modal>

            {/* Success/Error Modal */}
            <Modal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
                type={successModal.type}
                title={successModal.title}
                message={successModal.message}
                confirmText={successModal.type === 'success' ? '¡Genial!' : 'Entendido'}
            />

            {/* Hook-based modal */}
            {modal.Modal}

            <AdminHistory />
        </>
    )
}
