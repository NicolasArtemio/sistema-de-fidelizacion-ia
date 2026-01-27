'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Scissors, ShieldAlert, Lock, KeyRound } from 'lucide-react'
import { loginOrRegister } from '@/app/server-actions'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'

// HARD-CODED ADMIN NUMBER - MUST MATCH .env ADMIN_WHATSAPP
const ADMIN_WHATSAPP_NUMBER = '2284716778'

export default function LoginForm() {
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [whatsappValue, setWhatsappValue] = useState('')
    const [nameValue, setNameValue] = useState('')
    const [showExistsModal, setShowExistsModal] = useState(false)
    const [tempPin, setTempPin] = useState('')

    // Detect if this is an admin login attempt
    const normalizedInput = whatsappValue?.replace(/\s/g, '')
    const normalizedAdmin = ADMIN_WHATSAPP_NUMBER.replace(/\s/g, '')
    const isAdminNumber = normalizedInput === normalizedAdmin

    // Helper to detect Next.js redirects
    const isRedirectError = (err: unknown) => {
        return (
            typeof err === 'object' && err !== null && (
                (err as any).message === 'NEXT_REDIRECT' ||
                (err as any).digest?.includes('NEXT_REDIRECT') ||
                ('digest' in err && typeof (err as any).digest === 'string' && (err as any).digest.startsWith('NEXT_REDIRECT'))
            )
        )
    }

    const handleSubmit = async (formData: FormData) => {
        const whatsapp = formData.get('whatsapp') as string
        const pin = formData.get('pin') as string
        const password = formData.get('password') as string
        const secretKey = formData.get('secret_key') as string

        // Don't clear error here if we are submitting from the modal (which sets force_login)
        // But simpler: just clear it.
        setError(null)

        // Validation based on user type
        if (isAdminNumber) {
            // ADMIN: Require password + device key
            if (!password || password.trim() === '') {
                setError('La contraseña es OBLIGATORIA para el acceso de Admin')
                toast.error('La contraseña es OBLIGATORIA para el acceso de Admin')
                return
            }
            if (!secretKey || secretKey.trim() === '') {
                setError('La clave del dispositivo es OBLIGATORIA para el acceso de Admin')
                toast.error('La clave del dispositivo es OBLIGATORIA para el acceso de Admin')
                return
            }
        } else {
            // CLIENT: Require 4-digit PIN
            if (!pin || pin.trim() === '') {
                setError('Por favor ingresá tu PIN de 4 dígitos')
                toast.error('Por favor ingresá tu PIN de 4 dígitos')
                return
            }
            if (!/^\d{4}$/.test(pin)) {
                setError('El PIN debe tener exactamente 4 dígitos')
                toast.error('El PIN debe tener exactamente 4 dígitos')
                return
            }
        }

        startTransition(async () => {
            try {
                const res = await loginOrRegister(formData)
                if (res?.error) {
                    if (res.code === 'USER_EXISTS') {
                        setError(null) // Clear any previous error
                        setShowExistsModal(true)
                        return // Stop execution here
                    }
                    console.error('Server Error:', res.error)
                    setError(res.error)
                    toast.error(res.error)
                } else if (res?.success && res?.redirectUrl) {
                    // 🟢 FIX: Handle manual redirect from server response
                    toast.success('¡Ingreso exitoso!')
                    window.location.href = res.redirectUrl
                }
            } catch (err: unknown) {
                // Handle Next.js redirect - Silent Success (Legacy support)
                if (isRedirectError(err)) {
                    window.location.href = '/dashboard'
                    return
                }
                
                console.error('Submission Error:', err)
                setError('Credenciales inválidas. Por favor intentá de nuevo.')
                toast.error('Credenciales inválidas. Por favor intentá de nuevo.')
            }
        })
    }

    const handleModalSubmit = () => {
        if (!tempPin || tempPin.length !== 4) {
            toast.error('El PIN debe tener 4 dígitos')
            return
        }
        
        const formData = new FormData()
        formData.append('name', nameValue)
        formData.append('whatsapp', whatsappValue)
        formData.append('pin', tempPin)
        formData.append('force_login', 'true') // Ensure we only try to login, never register
        
        handleSubmit(formData)
    }

    return (
        <>
        <Card className="w-full max-w-md mx-auto border-gold-500/50 bg-neutral-950/90 backdrop-blur-xl shadow-2xl shadow-gold-500/20">
            <CardHeader className="text-center space-y-2">
                <div className="flex justify-center mb-2">
                    <div className="relative w-24 h-24">
                        <img 
                            src="/blogo.png?v=1" 
                            alt="tulook logo" 
                            className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                        />
                    </div>
                </div>
                <CardTitle className="text-3xl font-extrabold tracking-tight text-white uppercase"></CardTitle>
                <CardDescription className="text-zinc-400 font-medium">
                    Ingresá tus datos para acceder a tus premios
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-5">
                    {/* Name Field */}
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-zinc-300 font-bold">Nombre Completo</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Juan Pérez"
                            required
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            className="bg-neutral-900/50 border-zinc-800 focus:border-gold-500 focus:ring-gold-500/20 text-white font-medium"
                        />
                    </div>

                    {/* WhatsApp Field */}
                    <div className="space-y-2">
                        <Label htmlFor="whatsapp" className="text-zinc-300 font-bold">Número de WhatsApp</Label>
                        <Input
                            id="whatsapp"
                            name="whatsapp"
                            type="tel"
                            placeholder="11 1234 5678"
                            required
                            value={whatsappValue}
                            onChange={(e) => setWhatsappValue(e.target.value)}
                            className="bg-neutral-900/50 border-zinc-800 focus:border-gold-500 focus:ring-gold-500/20 text-white font-medium"
                        />
                    </div>

                    {/* Conditional Fields based on user type */}
                    {isAdminNumber ? (
                        // ADMIN FIELDS
                        <>
                            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                                <p className="text-amber-400 text-xs font-medium flex items-center gap-2">
                                    <ShieldAlert className="w-4 h-4" />
                                    Acceso Admin detectado - seguridad reforzada requerida
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-zinc-300 font-bold">Contraseña de Admin</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="Ingresá tu contraseña"
                                    className="bg-neutral-900/50 border-zinc-800 focus:border-gold-500 focus:ring-gold-500/20 text-white font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="secret_key" className="text-zinc-300 font-bold">Clave de Seguridad</Label>
                                <Input
                                    id="secret_key"
                                    name="secret_key"
                                    type="password"
                                    placeholder="Clave secreta del dispositivo"
                                    className="bg-neutral-900/50 border-zinc-800 focus:border-gold-500 focus:ring-gold-500/20 text-white font-medium"
                                />
                            </div>
                        </>
                    ) : (
                        // CLIENT PIN FIELD
                        <div className="space-y-2">
                            <Label htmlFor="pin" className="flex items-center gap-2 text-zinc-300 font-bold">
                                <KeyRound className="w-4 h-4 text-gold-500" />
                                PIN de 4 Dígitos
                            </Label>
                            <Input
                                id="pin"
                                name="pin"
                                type="password"
                                inputMode="numeric"
                                pattern="\d{4}"
                                maxLength={4}
                                placeholder="Ingresá o creá tu PIN"
                                className="bg-neutral-900/50 border-zinc-800 focus:border-gold-500 focus:ring-gold-500/20 text-white font-medium text-center text-xl tracking-[0.5em] font-mono"
                            />
                            <p className="text-xs text-zinc-500">
                                ¿Nuevo usuario? Este será tu PIN. ¿Ya tenés cuenta? Ingresá tu PIN para entrar.
                            </p>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-950/20 border border-red-900/50 rounded-lg text-red-400 text-sm">
                            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        className="w-full bg-gold-500 text-black hover:bg-gold-400 font-extrabold h-12 text-lg shadow-[0_0_20px_rgba(212,175,55,0.3)] transition-all hover:scale-[1.02]"
                        disabled={isPending}
                    >
                        {isPending ? (
                            <span className="flex items-center gap-2">
                                <Lock className="w-4 h-4 animate-pulse" />
                                Verificando...
                            </span>
                        ) : (
                            'INGRESAR'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>

        <Modal
            isOpen={showExistsModal}
            onClose={() => setShowExistsModal(false)}
            type="warning"
            title="Número Registrado"
            message="Este número ya está registrado. Ingresá tu PIN para continuar."
            confirmText={isPending ? "Verificando..." : "Ingresar"}
            onConfirm={handleModalSubmit}
        >
            <div className="py-4">
                <Input
                    type="password"
                    placeholder="PIN de 4 dígitos"
                    className="text-center text-2xl tracking-widest bg-zinc-900/50 border-amber-500/30 focus:border-amber-500"
                    maxLength={4}
                    value={tempPin}
                    onChange={(e) => setTempPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                />
            </div>
        </Modal>
        </>
    )
}
