'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Clock, User, Gift, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import confetti from 'canvas-confetti'

import { useModal, Modal } from '@/components/ui/Modal'
import BarberLoader from '@/components/ui/BarberLoader'
import { adjustPoints, getPendingRedemptions, processRedemptionRequest } from '@/app/server-actions'

import AdminHistory from '@/components/admin/AdminHistory'
import PointActions from '@/components/admin/PointActions'
import ClientSearch from '@/components/admin/ClientSearch'
import ClientMobileCard from '@/components/admin/ClientMobileCard'
import PendingRequests from '@/components/admin/PendingRequests'
import AdjustPointsModal from '@/components/admin/modals/AdjustPointsModal'
import SelectionModal from '@/components/admin/modals/SelectionModal'
import RedeemModal from '@/components/admin/modals/RedeemModal'

import { Profile, RedemptionRequest } from '@/types'

export default function ClientManagement() {
    const [hasMounted, setHasMounted] = useState(false)
    const [profiles, setProfiles] = useState<Profile[]>([])
    const [pendingRequests, setPendingRequests] = useState<RedemptionRequest[]>([])
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

    const fetchPendingRequests = async () => {
        const data = await getPendingRedemptions()
        if (data) {
            setPendingRequests(data as any)
        }
    }

    const handleProcessRequest = async (requestId: string, approved: boolean) => {
        setIsProcessing(true)
        const res = await processRedemptionRequest(requestId, approved)
        setIsProcessing(false)
        
        if (res.success) {
            setSuccessModal({
                isOpen: true,
                title: approved ? 'Solicitud Aprobada' : 'Solicitud Rechazada',
                message: approved ? 'Los puntos han sido descontados correctamente.' : 'La solicitud ha sido rechazada.',
                type: 'success'
            })
            fetchPendingRequests()
            fetchProfiles()
        } else {
            setSuccessModal({
                isOpen: true,
                title: 'Error',
                message: res.error || 'Error al procesar la solicitud',
                type: 'error'
            })
        }
    }

    const fetchProfiles = async () => {
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

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProfiles()
            fetchPendingRequests()
        }, 500)
        return () => clearTimeout(timer)
    }, [search, refreshTrigger])

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
                setSuccessModal({
                    isOpen: true,
                    title: 'Error',
                    message: typeof res.error === 'string' ? res.error : 'Error al ajustar puntos',
                    type: 'error',
                })
            } else {
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
                }, 4000)
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
            <div className="w-full max-w-[100vw] overflow-x-hidden">
                <Card className="w-full max-w-full bg-card border-white/5">
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
                    <ClientSearch value={search} onChange={setSearch} />
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="py-12">
                            <BarberLoader fullScreen={false} text="Sincronizando clientes..." />
                        </div>
                    ) : (
                        <>
                            <div className="w-full overflow-x-hidden">
                                <PendingRequests 
                                    requests={pendingRequests} 
                                    isProcessing={isProcessing} 
                                    onProcess={handleProcessRequest} 
                                />
                            </div>

                            {/* MOBILE VIEW */}
                            <div className="md:hidden flex flex-col gap-6 pb-24 w-full max-w-full">
                                {profiles.map((profile) => (
                                    <ClientMobileCard
                                        key={profile.id}
                                        profile={profile}
                                        refreshTrigger={refreshTrigger}
                                        onAddPoints={handleOpenAdjustModal}
                                        onOpenRedeem={(p) => setSelectionModal({ isOpen: true, profile: p })}
                                    />
                                ))}
                            </div>

                            {/* DESKTOP VIEW */}
                            <div className="hidden md:block w-full rounded-xl border border-white/5 bg-zinc-900/50">
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
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                                                        {profile.avatar_url ? (
                                                            <img 
                                                                src={`${profile.avatar_url}?t=${refreshTrigger}`} 
                                                                alt={profile.full_name} 
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs border border-amber-500/20">
                                                                {profile.full_name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="overflow-hidden">
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
                                                <PointActions onAddPoints={(points) => handleOpenAdjustModal(profile, points)} />

                                                <Button 
                                                    size="sm" 
                                                    className="h-8 bg-amber-500 hover:bg-amber-600 text-black font-bold px-3 rounded-lg shadow-sm"
                                                    onClick={() => setSelectionModal({ isOpen: true, profile })}
                                                >
                                                    <Gift className="w-3.5 h-3.5 mr-1.5" />
                                                    Canjes
                                                </Button>
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
            <AdminHistory />
            </div>

            <AdjustPointsModal
                isOpen={adjustModalOpen}
                onClose={() => !showSuccessAnimation && !isProcessing && setAdjustModalOpen(false)}
                selectedProfile={selectedProfile}
                pointsToAdjust={pointsToAdjust}
                onConfirm={handleConfirmAdjust}
                isProcessing={isProcessing}
                showSuccessAnimation={showSuccessAnimation}
                refreshTrigger={refreshTrigger}
            />

            <SelectionModal
                isOpen={selectionModal.isOpen}
                onClose={() => setSelectionModal({ isOpen: false, profile: null })}
                profile={selectionModal.profile}
                onSelect={(amount, reward) => {
                    if (selectionModal.profile) {
                        openRedeemModal(selectionModal.profile, amount, reward)
                        setSelectionModal({ isOpen: false, profile: null })
                    }
                }}
            />

            <RedeemModal
                isOpen={redeemModal.isOpen}
                onClose={() => !showSuccessAnimation && !isProcessing && setRedeemModal(prev => ({ ...prev, isOpen: false }))}
                profile={redeemModal.profile}
                amount={redeemModal.amount}
                reward={redeemModal.reward}
                onConfirm={handleRedeem}
                isProcessing={isProcessing}
                showSuccessAnimation={showSuccessAnimation}
            />

            <Modal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal(prev => ({ ...prev, isOpen: false }))}
                type={successModal.type}
                title={successModal.title}
                message={successModal.message}
                confirmText={successModal.type === 'success' ? '¡Genial!' : 'Entendido'}
            />

            {modal.Modal}
        </>
    )
}
