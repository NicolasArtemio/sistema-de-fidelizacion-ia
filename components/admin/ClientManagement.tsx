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
                        <div className="hidden md:block space-y-4">
                            {/* List Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-zinc-900/20 rounded-lg border border-white/5">
                                <div className="col-span-4">Usuario</div>
                                <div className="col-span-3 text-center">Gastables</div>
                                <div className="col-span-2 text-center">Histórico</div>
                                <div className="col-span-3 text-center">Acciones</div>
                            </div>

                            {/* Client Rows */}
                            <div className="space-y-3">
                                {profiles.map((profile) => (
                                    <div
                                        key={profile.id}
                                        className="grid grid-cols-12 gap-4 items-center p-4 bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 rounded-xl transition-all group"
                                    >
                                        {/* Col 1: Usuario (4 cols) */}
                                        <div className="col-span-4 flex flex-col gap-1">
                                            <div className="font-medium text-base text-zinc-100 group-hover:text-white transition-colors">
                                                {profile.full_name || 'Sin Nombre'}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-zinc-500 font-mono">
                                                    {profile.whatsapp}
                                                </span>
                                                {profile.role === 'admin' && (
                                                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-800 text-zinc-500 rounded border border-zinc-700/50">
                                                        ADMIN
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Col 2: Gastables (3 cols) - Large Gold Font */}
                                        <div className="col-span-3 flex justify-center">
                                            <div className="flex items-center gap-2">
                                                <Star className={cn(
                                                    "w-5 h-5",
                                                    profile.points >= 10 ? "text-amber-500 fill-amber-500" : "text-zinc-600"
                                                )} />
                                                <span className={cn(
                                                    "text-2xl font-bold tracking-tight",
                                                    profile.points >= 10 ? "text-amber-500" : "text-zinc-500"
                                                )}>
                                                    {profile.points}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Col 3: Histórico (2 cols) - Ver Button */}
                                        <div className="col-span-2 flex justify-center">
                                             <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="text-zinc-500 hover:text-white hover:bg-white/10"
                                                title="Ver Historial"
                                                onClick={() => {}} // Placeholder: Connect to history logic later
                                             >
                                                <Eye className="w-4 h-4 mr-1" />
                                                <span className="text-xs">Ver</span>
                                             </Button>
                                        </div>

                                        {/* Col 4: Acciones (3 cols) - Complex Grid */}
                                        <div className="col-span-3 flex flex-col gap-2">
                                            {/* Top Row: + - Key */}
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-8 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/20"
                                                        onClick={() => handleOpenAdjustModal(profile, 5)}
                                                        title="Sumar (+)"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        className="h-7 w-8 bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                                                        onClick={() => handleOpenAdjustModal(profile, -5)}
                                                        title="Restar (-)"
                                                    >
                                                        <Minus className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7 text-zinc-600 hover:text-zinc-300"
                                                    onClick={() => setResetPinModal({ isOpen: true, profile, newPin: '' })}
                                                    title="Resetear PIN"
                                                >
                                                    <KeyRound className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>

                                            {/* Middle Row: Canjear (Full Width) */}
                                            <Button
                                                size="sm"
                                                className="w-full h-8 bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-[0_0_10px_-2px_rgba(245,158,11,0.3)] transition-all"
                                                onClick={() => setSelectionModal({ isOpen: true, profile })}
                                            >
                                                <Gift className="w-3.5 h-3.5 mr-1.5" />
                                                Canjear
                                            </Button>

                                            {/* Bottom Row: Input + Apply */}
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    className="h-7 text-xs bg-zinc-950/30 border-white/10 focus:border-amber-500/50 px-2"
                                                    placeholder="0"
                                                    value={customPoints[profile.id] || ''}
                                                    onChange={(e) => handleCustomPointsChange(profile.id, e.target.value)}
                                                />
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 text-[10px] px-2 bg-zinc-800 text-zinc-400 hover:text-white"
                                                    onClick={() => handleApplyCustomPoints(profile)}
                                                >
                                                    Aplicar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {profiles.length === 0 && (
                                    <div className="text-center py-16">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-900 mb-4">
                                            <Search className="w-8 h-8 text-zinc-700" />
                                        </div>
                                        <p className="text-zinc-500">No se encontraron clientes.</p>
                                        {search && (
                                            <Button
                                                variant="link"
                                                onClick={() => setSearch('')}
                                                className="text-primary mt-2"
                                            >
                                                Limpiar búsqueda
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Mobile List View (Sleek & Compact) */}
                        <div className="flex flex-col gap-2 md:hidden pb-24">
                            {profiles.map((profile) => (
                                <div key={profile.id} className="flex flex-col w-full bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden shadow-lg p-3">
                                    
                                    {/* Line 1: Name and Points */}
                                    <div className="flex justify-between items-center w-full mb-1">
                                        <div className="font-bold text-base text-white truncate mr-2 flex-1">
                                            {profile.full_name || 'Sin Nombre'}
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap shrink-0",
                                            profile.points >= 10 
                                                ? "bg-amber-500/20 text-amber-500 border border-amber-500/20 shadow-[0_0_10px_-2px_rgba(245,158,11,0.3)]" 
                                                : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                                        )}>
                                            <Star className="w-3 h-3 fill-current" />
                                            {profile.points}
                                        </div>
                                    </div>

                                    {/* Line 2: Phone and Badge */}
                                    <div className="flex justify-between items-center w-full mb-2.5">
                                        <div className="text-xs text-zinc-500 font-mono">
                                            {profile.whatsapp}
                                        </div>
                                        {profile.role === 'admin' && (
                                            <span className="px-1.5 py-0.5 text-[9px] font-bold bg-zinc-800 text-zinc-500 rounded border border-zinc-700/50 uppercase tracking-wider">
                                                ADMIN
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions Grid (Optimized Compact) */}
                                    <div className="grid grid-cols-1 gap-2">
                                        {/* Row 1: Quick Actions (3 columns) */}
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button 
                                                size="sm"
                                                className="h-9 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all rounded-lg"
                                                onClick={() => handleOpenAdjustModal(profile, 5)}
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                            
                                            <Button 
                                                size="sm"
                                                className="h-9 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all rounded-lg"
                                                onClick={() => handleOpenAdjustModal(profile, -5)}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </Button>

                                            <Button 
                                                variant="secondary" 
                                                size="sm"
                                                className="h-9 bg-zinc-800 text-zinc-400 hover:text-white border border-white/5 active:scale-95 transition-all rounded-lg"
                                                onClick={() => handleApplyCustomPoints(profile)}
                                            >
                                                <Key className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {/* Row 2: Canjear (Full Width) */}
                                        <Button
                                            className="w-full h-9 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)] rounded-lg active:scale-95 transition-all border border-amber-400/50"
                                            onClick={() => setSelectionModal({ isOpen: true, profile })}
                                        >
                                            <Gift className="w-4 h-4 mr-2" />
                                            CANJEAR
                                        </Button>
                                        
                                        {/* Hidden Custom Input (Shown only when needed or managed via Modal/Popovers to save space) 
                                            For this sleek version, we assume the 'Key' button or similar triggers manual entry logic 
                                            or keeps the input but very compact. 
                                            User requested: "For the +, -, and Key icons, use a 3-column grid... fit in a single row"
                                            The input field itself takes space. Let's keep it conditional or simplified if possible, 
                                            but based on prompt "The 'Canjear' button... For the +, -, and Key icons...", 
                                            it implies the custom input might be secondary or handled differently.
                                            
                                            However, the user prompt explicitly said: "For the +, -, and Key icons, use a 3-column grid... 
                                            At the bottom, a small numeric input field with an 'Aplicar' button next to it for custom point adjustments." 
                                            Wait, the prompt says "For the +, -, and Key icons...". 
                                            I will interpret "Key icon" as the toggle or submit for manual entry, 
                                            or I should place the input row below if it's strictly needed always visible.
                                            
                                            Let's re-read carefully: "Action Buttons Grid: ... For the +, -, and Key icons, use a 3-column grid...". 
                                            It seems the 'Key' button replaces the inline input+button combo for the compact view, 
                                            likely opening a modal (like the existing adjust modal) or toggling the input.
                                            
                                            Given the existing `handleApplyCustomPoints` uses `customPoints` state, 
                                            I will keep the input visible but VERY compact if needed, 
                                            OR better, per the "Key icon" instruction, I will make the Key button 
                                            focus/reveal the input or just use the modal logic. 
                                            
                                            Actually, let's implement the 3-col grid as requested: +, -, Key. 
                                            And then Canjear. 
                                            The 'Key' button will trigger the manual input logic (focus or apply).
                                            But since we need a place to TYPE the number, I'll add a compact input row 
                                            that appears only when 'Key' is active or just keep it simple.
                                            
                                            To strictly follow "Key icons... 3-column grid":
                                            I will place the input row below IF the user wants to type, 
                                            or maybe the 'Key' button IS the manual entry trigger.
                                            Let's use the 'Key' button to toggle a small input row below, 
                                            or just show the input row constantly but compact?
                                            The prompt says "For the +, -, and Key icons...". 
                                            I'll implement the 3 buttons. 
                                            And I'll add the input field below ONLY if a value is typed? 
                                            No, I'll put the input field in the 3rd slot instead of a Key icon? 
                                            No, "Key icons". 
                                            
                                            Decision: 3 Buttons (+, -, Key). 
                                            'Key' opens the Manual Adjustment Modal (which already exists and works great).
                                            This saves the most space.
                                        */}
                                    </div>
                                    
                                    {/* Optional: Inline Input for Custom Points (if user insists on typing in-card)
                                        The previous code had an inline input. 
                                        If I remove it, I must ensure 'Key' opens a modal. 
                                        `handleApplyCustomPoints` uses `customPoints[profile.id]`.
                                        If I change 'Key' to open a modal, I need to adjust the handler or UI.
                                        
                                        Let's compromise: 
                                        Row 1: +, -, Key (Toggle Input)
                                        Row 2: Input (Visible only if Toggled) - THIS IS SLEEK.
                                        Row 3: Canjear.
                                        
                                        Actually, simpler: 
                                        The user said: "At the bottom, a small numeric input field..." in the PREVIOUS prompt.
                                        In THIS prompt: "For the +, -, and Key icons, use a 3-column grid".
                                        So I will implement the 3-col grid. 
                                        I will map the 'Key' button to `handleApplyCustomPoints` 
                                        but we need the input field. 
                                        
                                        Let's put the input field in the grid? No, "Key icons".
                                        I will put the Input field + OK button as a hidden/expandable section 
                                        OR just below the 3-col grid, very compact.
                                        
                                        Refined Plan:
                                        Row 1: +, -, Key (Focus/Show Input)
                                        Row 2 (Conditional): Input Field + OK (if Key pressed)
                                        Row 3: Canjear.
                                        
                                        Wait, "Action Buttons Grid... The 'Canjear' button... For the +, -, and Key icons...".
                                        It implies Canjear is separate.
                                        
                                        Let's stick to the prompt's "Key icon" literally. 
                                        I'll add the Input field row but make it look like a part of the "Key" interaction 
                                        or just below. 
                                        Actually, if I look at `handleApplyCustomPoints`, it reads from `customPoints`.
                                        I will add the input field as a compact row below the buttons if `customPoints` has a value 
                                        or just always visible but small? 
                                        "Sleek & Compact" -> Hide until needed. 
                                        But to be safe and functional without complex state changes right now, 
                                        I will make the 'Key' button simply focus an input that is 
                                        visually integrated or just use the input directly in the 3rd slot?
                                        Input in 3rd slot is tight.
                                        
                                        Let's go with:
                                        Grid Cols 3: [+], [-], [Input]
                                        Canjear below.
                                        
                                        BUT user said "Key icons". 
                                        I will use:
                                        Grid Cols 3: [+], [-], [Key (Manual Mode)]
                                        [Canjear]
                                        
                                        And when [Key] is clicked -> Open the `adjustModal` with 0 so user can type? 
                                        Yes! `handleOpenAdjustModal(profile, 0)` could be interpreted as "Manual".
                                        The `adjustModal` supports manual input? 
                                        Currently `handleOpenAdjustModal` takes a fixed value.
                                        I might need to tweak `handleOpenAdjustModal` to support custom entry 
                                        OR just leave the inline input row but make it `hidden` by default?
                                        
                                        Let's look at the code I'm replacing:
                                        It had `Input` and `Button OK`.
                                        
                                        I will replace the inline input with a "Key" button that opens a new `ManualEntry` state 
                                        or just keeps the input visible but very small.
                                        
                                        ACTUALLY, simplest interpretation of "Key icon" in a grid:
                                        Use the Key button to TOGGLE the visibility of the input row.
                                        I'll add a local state? No, avoid complex refactors if possible.
                                        
                                        Alternative: The "Key" button IS the submit button for the input. 
                                        And the input is always there? No, takes space.
                                        
                                        Let's try:
                                        Grid Cols 3: [+], [-], [Manual (Key Icon)]
                                        [Canjear]
                                        
                                        Clicking [Manual] opens the existing `adjustModal` but allows typing?
                                        The current `adjustModal` is "Confirmar +/- X". 
                                        I will add a `handleOpenManualModal(profile)`?
                                        
                                        Better yet, I'll just keep the Input row but make it `h-9` and full width below the grid?
                                        User asked for "Action Buttons Grid... For the +, -, and Key icons...".
                                        I will assume the user WANTS the 3-col grid.
                                        I'll put the input field in the "Key" slot? No.
                                        
                                        I will implement:
                                        Row 1: [Canjear] (Top priority)
                                        Row 2: [+], [-], [Input field with Key icon inside?]
                                        
                                        User said: "The 'Canjear' button should have a smaller height... For the +, -, and Key icons, use a 3-column grid".
                                        So:
                                        Row 1: [+], [-], [Key]
                                        Row 2: [Canjear]
                                        
                                        And I will add the `Input` field below, visible ONLY if `customPoints[profile.id]` is not empty?
                                        Or just replace the [Key] button with the Input field?
                                        "Key icon" implies a button.
                                        
                                        Let's go with the most robust "Sleek" option:
                                        1. [+], [-], [Key]
                                        2. [Canjear]
                                        3. If [Key] is clicked, show Input row? 
                                        
                                        I'll implement the layout exactly as requested visually:
                                        <div className="grid grid-cols-3 gap-2">
                                            <Button + />
                                            <Button - />
                                            <div className="relative">
                                                <Input className="pl-8..." placeholder="Man..." />
                                                <Key className="absolute left-2..." />
                                            </div>
                                        </div>
                                        This fits 3 cols! Input in 3rd col.
                                        
                                        Let's do that. Input in the 3rd column with a Key icon.
                                    */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <Button 
                                            size="sm"
                                            className="h-9 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95 transition-all rounded-lg"
                                            onClick={() => handleOpenAdjustModal(profile, 5)}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                        
                                        <Button 
                                            size="sm"
                                            className="h-9 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all rounded-lg"
                                            onClick={() => handleOpenAdjustModal(profile, -5)}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>

                                        <div className="relative flex items-center">
                                             <Input 
                                                type="number" 
                                                placeholder="#" 
                                                className="h-9 bg-zinc-950/50 border-white/10 pr-2 pl-2 text-center rounded-lg focus-visible:ring-0 focus-visible:border-amber-500/50 text-xs w-full"
                                                value={customPoints[profile.id] || ''}
                                                onChange={(e) => handleCustomPointsChange(profile.id, e.target.value)}
                                            />
                                            {/* Small absolute button to apply if value exists */}
                                            {customPoints[profile.id] && (
                                                <button 
                                                    onClick={() => handleApplyCustomPoints(profile)}
                                                    className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-black rounded-full flex items-center justify-center shadow-lg animate-in zoom-in"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Canjear Button */}
                                    <Button
                                        className="w-full h-9 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm shadow-[0_0_15px_-3px_rgba(245,158,11,0.4)] rounded-lg active:scale-95 transition-all border border-amber-400/50 mt-2"
                                        onClick={() => setSelectionModal({ isOpen: true, profile })}
                                    >
                                        <Gift className="w-4 h-4 mr-2" />
                                        CANJEAR
                                    </Button>
                                </div>
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
