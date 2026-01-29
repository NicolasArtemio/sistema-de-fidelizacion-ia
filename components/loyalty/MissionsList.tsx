// path/to/components/loyalty/MissionsList.tsx
'use client'

import { motion } from 'framer-motion'
import { Share2, MapPin, Instagram, CheckCircle2, Trophy, Rocket, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

export default function MissionsList() {
    const handleShare = async () => {
        const shareData = {
            title: 'Unite a Tulook',
            text: '¡Che, unite a la App de Tulook! Registrate acá y sumamos puntos los dos:',
            url: window.location.origin
        }

        try {
            if (navigator.share) {
                await navigator.share(shareData)
                toast.success('¡Gracias por compartir!')
            } else {
                await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`)
                toast.success('Link copiado al portapapeles')
            }
        } catch (err) {
            console.error('Error sharing:', err)
        }
    }

    const handleWhatsAppProof = () => {
        const text = encodeURIComponent('Hola! Mi amigo ya se registró, acá te mando la captura para sumar mis 20 puntos.')
        window.open(`https://wa.me/5491112345678?text=${text}`, '_blank')
    }

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/20">
                    <Rocket className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Misiones</h2>
                    <p className="text-zinc-400 text-sm">Completá tareas y ganá puntos extra</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Referral Mission - Priority */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="bg-gradient-to-br from-zinc-900 to-zinc-950 border-amber-500/30 overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Trophy className="w-24 h-24 text-amber-500" />
                        </div>
                        
                        <CardContent className="p-5 space-y-4 relative z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-1">¡Traé a tus conocidos!</h3>
                                    <p className="text-sm text-zinc-400">Invitá amigos y sumá puntos cuando se registren.</p>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1">
                                    <span className="text-amber-500 font-bold text-sm">+20 pts</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button 
                                    onClick={handleShare}
                                    className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5"
                                >
                                    <Share2 className="w-4 h-4 mr-2 text-indigo-400" />
                                    Invitar
                                </Button>
                                <Button 
                                    onClick={handleWhatsAppProof}
                                    className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-500 border border-emerald-500/20"
                                >
                                    <MessageCircle className="w-4 h-4 mr-2" />
                                    Enviar Captura
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Google Maps Mission */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-zinc-900/50 border-white/5 hover:bg-zinc-900/80 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg">
                                    <MapPin className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Dejanos 5 estrellas</h3>
                                    <p className="text-xs text-zinc-400">En Google Maps</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-amber-500 font-bold text-sm">+10 pts</span>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-white/5 hover:bg-white/10">
                                    <Rocket className="w-4 h-4 text-zinc-400" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Instagram Mission */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Card className="bg-zinc-900/50 border-white/5 hover:bg-zinc-900/80 transition-colors">
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-pink-500/10 rounded-lg">
                                    <Instagram className="w-6 h-6 text-pink-400" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Etiquetanos</h3>
                                    <p className="text-xs text-zinc-400">En tu historia</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="text-amber-500 font-bold text-sm">+10 pts</span>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-full bg-white/5 hover:bg-white/10">
                                    <Rocket className="w-4 h-4 text-zinc-400" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            <div className="text-center px-4 py-6">
                <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
                    Nota: Los puntos de misiones son cargados manualmente por el barbero al recibir tu comprobante.
                </p>
            </div>
        </div>
    )
}
