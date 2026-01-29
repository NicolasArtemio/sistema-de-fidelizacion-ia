'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Crown, History, LogOut, MessageCircle, Ticket, Coins, User as UserIcon, Camera, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { logout } from '@/app/server-actions'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'

interface UserProfileProps {
    userId: string
    userName: string
    currentPoints: number
}

interface Transaction {
    id: string
    type: 'earn' | 'redeem'
    amount: number
    description: string
    created_at: string
}

export default function UserProfile({ userId, userName, currentPoints }: UserProfileProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [totalEarned, setTotalEarned] = useState(0)
    const [redeemedCount, setRedeemedCount] = useState(0)
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Profile for Total Accumulated Points & Avatar
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('total_points_accumulated, avatar_url')
                    .eq('id', userId)
                    .single()
                
                if (profile) {
                    setTotalEarned(profile.total_points_accumulated || 0)
                    setAvatarUrl(profile.avatar_url)
                }

                // 2. Fetch Redemptions Count
                const { count } = await supabase
                    .from('transactions')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('type', 'redeem')
                
                setRedeemedCount(count || 0)

                // 3. Fetch Recent History
                const { data: history } = await supabase
                    .from('transactions')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false })
                    .limit(20)
                
                if (history) {
                    setTransactions(history as any[])
                }

            } catch (error) {
                console.error('Error fetching profile data:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [userId, supabase])

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return
        }

        const file = e.target.files[0]
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor seleccioná una imagen válida')
            return
        }

        setUploading(true)

        try {
            // 1. Compress Image
            const compressedFile = await compressImage(file)
            
            // 2. Upload to Supabase Storage
            const fileExt = 'webp' // We convert to webp
            const fileName = `${userId}/avatar.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, compressedFile, {
                    contentType: 'image/webp',
                    upsert: true
                })

            if (uploadError) throw uploadError

            // 3. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 4. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', userId)

            if (updateError) throw updateError

            // 5. Update Local State
            setAvatarUrl(`${publicUrl}?t=${Date.now()}`)
            toast.success('¡Foto de perfil actualizada!')

        } catch (error) {
            console.error('Error uploading avatar:', error)
            toast.error('Error al subir la imagen')
        } finally {
            setUploading(false)
        }
    }

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 400
                    const MAX_HEIGHT = 400
                    let width = img.width
                    let height = img.height

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width
                            width = MAX_WIDTH
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height
                            height = MAX_HEIGHT
                        }
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)
                    
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob)
                        } else {
                            reject(new Error('Canvas to Blob failed'))
                        }
                    }, 'image/webp', 0.8)
                }
                img.onerror = (error) => reject(error)
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const isVip = currentPoints >= 100

    return (
        <div className="space-y-6 pb-20">
            {/* User Header */}
            <div className="flex flex-col items-center justify-center pt-6 pb-2 text-center space-y-3">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                    />
                    
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 overflow-hidden relative ${isVip ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700 bg-zinc-800'}`}>
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className={`w-12 h-12 ${isVip ? 'text-amber-500' : 'text-zinc-500'}`} />
                        )}
                        
                        {/* Loading Overlay */}
                        {uploading && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                                <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                            </div>
                        )}

                        {/* Hover Overlay (Desktop) & Always Visible Camera Icon (Mobile hint) */}
                        {!uploading && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="w-8 h-8 text-white/80" />
                            </div>
                        )}
                    </div>

                    {/* Camera Badge (Always visible for better UX) */}
                    <div className="absolute bottom-0 right-0 bg-zinc-900 border border-zinc-700 p-1.5 rounded-full z-10">
                        <Camera className="w-3 h-3 text-zinc-400" />
                    </div>

                    {isVip && (
                        <div className="absolute -top-2 -right-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-lg shadow-amber-500/20 z-10">
                            <Crown className="w-3 h-3" />
                            VIP
                        </div>
                    )}
                </div>
                
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                        {userName}
                    </h2>
                    <p className={`text-sm font-medium ${isVip ? 'text-amber-500' : 'text-zinc-500'}`}>
                        {isVip ? 'Cliente Destacado' : 'Miembro del Club'}
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="bg-zinc-900/50 border-white/5">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <div className="p-2 bg-emerald-500/10 rounded-full">
                            <Coins className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-white">{totalEarned}</span>
                            <span className="text-xs text-zinc-500">Puntos Históricos</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-white/5">
                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                        <div className="p-2 bg-purple-500/10 rounded-full">
                            <Ticket className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <span className="block text-2xl font-bold text-white">{redeemedCount}</span>
                            <span className="text-xs text-zinc-500">Premios Canjeados</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* History Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                    <History className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-sm font-semibold text-zinc-300">Historial de Actividad</h3>
                </div>

                <div className="space-y-2">
                    {loading ? (
                        [...Array(3)].map((_, i) => (
                            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
                        ))
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-zinc-500 text-sm">No hay movimientos todavía</p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div 
                                key={tx.id} 
                                className="flex items-center justify-between p-3 bg-zinc-900/50 border border-white/5 rounded-xl hover:bg-zinc-900 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        p-2 rounded-lg 
                                        ${tx.type === 'earn' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
                                    `}>
                                        {tx.type === 'earn' ? <Coins className="w-4 h-4" /> : <Ticket className="w-4 h-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{tx.description || (tx.type === 'earn' ? 'Visita' : 'Canje')}</p>
                                        <p className="text-xs text-zinc-500">
                                            {format(new Date(tx.created_at), "d 'de' MMMM", { locale: es })}
                                        </p>
                                    </div>
                                </div>
                                <span className={`font-bold text-sm ${tx.type === 'earn' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {tx.type === 'earn' ? '+' : '-'}{tx.amount}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
                <Button 
                    className="w-full bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 h-12"
                    onClick={() => window.open('https://wa.me/5491112345678', '_blank')}
                >
                    <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
                    Soporte / Ayuda
                </Button>

                <form action={logout}>
                    <Button 
                        type="submit"
                        variant="ghost" 
                        className="w-full text-zinc-500 hover:text-red-400 hover:bg-red-950/20 h-12"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Cerrar Sesión
                    </Button>
                </form>
            </div>
        </div>
    )
}
