'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Search, Plus, Minus, Gift, Loader2, Sparkles, KeyRound, Check, Trophy, Lightbulb, Star, Scissors } from 'lucide-react'
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
                            className="pl-10 bg-zinc-800/50 border-zinc-700/50 focus:border-primary"
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
                        <div className="hidden md:block overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-white/10 hover:bg-transparent">
                                        <TableHead>Usuario</TableHead>
                                        <TableHead className="text-right">Gastables</TableHead>
                                        <TableHead className="text-right text-muted-foreground">Histórico</TableHead>
                                        <TableHead className="text-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {profiles.map((profile) => (
                                        <TableRow
                                            key={profile.id}
                                            className="border-white/5 hover:bg-white/5 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="font-medium text-white">
                                                    {profile.full_name || 'Unknown'}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {profile.whatsapp}
                                                </div>
                                                {profile.role === 'admin' && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded-full">
                                                        ADMIN
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {profile.points >= 10 && (
                                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                                                    )}
                                                    <span className={cn(
                                                        "text-2xl font-bold",
                                                        profile.points >= 10 ? "text-amber-400" : "text-primary"
                                                    )}>
                                                        {profile.points}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="text-muted-foreground font-mono">
                                                    {profile.total_points_accumulated ?? 0}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    {/* Quick action buttons */}
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-9 w-9 p-0 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                                                            onClick={() => handleOpenAdjustModal(profile, 1)}
                                                            disabled={isProcessing}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-9 w-9 p-0 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                                                            onClick={() => handleOpenAdjustModal(profile, -1)}
                                                            disabled={isProcessing || profile.points < 1}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </Button>

                                                        {/* Redeem Button (Removed, merged into select) */}
                                                        
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-9 w-9 p-0 text-muted-foreground hover:text-white hover:bg-white/10"
                                                            onClick={() => setResetPinModal({ isOpen: true, profile, newPin: '' })}
                                                            title="Resetear PIN"
                                                        >
                                                            <KeyRound className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {/* Quick redeem options */}
                                                    <div className="flex items-center gap-1.5">
                                                        {profile.points >= 5 && (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-9 px-3 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 flex items-center gap-2"
                                                                onClick={() => setSelectionModal({ isOpen: true, profile })}
                                                                title="Canjear Puntos"
                                                            >
                                                                <Gift className="w-4 h-4" />
                                                                <span className="hidden sm:inline font-bold">Canjear</span>
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* Custom amount input */}
                                                    <form
                                                        onSubmit={async (e) => {
                                                            e.preventDefault()
                                                            const form = e.target as HTMLFormElement
                                                            const input = form.elements.namedItem('amount') as HTMLInputElement
                                                            const amount = parseInt(input.value)
                                                            if (amount) {
                                                                handleOpenAdjustModal(profile, amount)
                                                                input.value = ''
                                                            }
                                                        }}
                                                        className="flex gap-1"
                                                    >
                                                        <Input
                                                            name="amount"
                                                            type="number"
                                                            placeholder="+/-"
                                                            className="w-16 h-7 text-xs px-2 bg-zinc-800/50 border-zinc-700/50"
                                                        />
                                                        <Button
                                                            size="sm"
                                                            type="submit"
                                                            variant="ghost"
                                                            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10"
                                                        >
                                                            Aplicar
                                                        </Button>
                                                    </form>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {profiles.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-12">
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Search className="w-8 h-8 opacity-50" />
                                                    <p>No se encontraron clientes.</p>
                                                    {search && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setSearch('')}
                                                            className="text-primary"
                                                        >
                                                            Limpiar búsqueda
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:hidden">
                            {profiles.map((profile) => (
                                <Card key={profile.id} className="bg-zinc-900/50 border-white/5">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-lg text-white">
                                                    {profile.full_name || 'Unknown'}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {profile.whatsapp}
                                                </div>
                                                {profile.role === 'admin' && (
                                                    <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-primary/20 text-primary rounded-full">
                                                        ADMIN
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <div className="flex items-center gap-1">
                                                    {profile.points >= 10 && (
                                                        <Star className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
                                                    )}
                                                    <span className={cn(
                                                        "text-3xl font-bold",
                                                        profile.points >= 10 ? "text-amber-400" : "text-primary"
                                                    )}>
                                                        {profile.points}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">puntos</span>
                                            </div>
                                        </div>

                                        <Button
                                            size="lg"
                                            className={cn(
                                                "w-full font-bold text-lg h-12 shadow-lg transition-all",
                                                profile.points >= 5 
                                                    ? "bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-black border border-yellow-200/50 animate-pulse"
                                                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed hover:bg-zinc-800"
                                            )}
                                            onClick={() => openRedeemModal(profile, 15, 'Corte Gratis')}
                                            disabled={profile.points < 5}
                                        >
                                            <Gift className="h-5 w-5 mr-2" />
                                            Canjear
                                        </Button>

                                        <div className="grid grid-cols-4 gap-2">
                                            <Button
                                                variant="outline"
                                                className="h-10 border-emerald-500/30 text-emerald-400 bg-emerald-500/5"
                                                onClick={() => handleOpenAdjustModal(profile, 1)}
                                                disabled={isProcessing}
                                            >
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-10 border-red-500/30 text-red-400 bg-red-500/5"
                                                onClick={() => handleOpenAdjustModal(profile, -1)}
                                                disabled={isProcessing || profile.points < 1}
                                            >
                                                <Minus className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="h-10 text-muted-foreground bg-white/5"
                                                onClick={() => setResetPinModal({ isOpen: true, profile, newPin: '' })}
                                            >
                                                <KeyRound className="h-5 w-5" />
                                            </Button>
                                            
                                            <form
                                                onSubmit={async (e) => {
                                                    e.preventDefault()
                                                    const form = e.target as HTMLFormElement
                                                    const input = form.elements.namedItem('amount') as HTMLInputElement
                                                    const amount = parseInt(input.value)
                                                    if (amount) {
                                                        handleOpenAdjustModal(profile, amount)
                                                        input.value = ''
                                                    }
                                                }}
                                                className="flex"
                                            >
                                                <div className="relative w-full">
                                                    <Input
                                                        name="amount"
                                                        type="number"
                                                        placeholder="+/-"
                                                        className="w-full h-10 text-center text-sm bg-zinc-800/50 border-zinc-700/50 p-0"
                                                    />
                                                </div>
                                            </form>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {profiles.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>No se encontraron clientes.</p>
                                </div>
                            )}
                        </div>
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
                                    <Label htmlFor="adjust-points">Cantidad de puntos</Label>
                                    <Input
                                        id="adjust-points"
                                        type="number"
                                        value={pointsToAdjust}
                                        onChange={(e) => setPointsToAdjust(parseInt(e.target.value) || 0)}
                                        className="text-center text-xl font-bold bg-background/50"
                                    />
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
