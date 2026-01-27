'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { QrCode, Loader2, Sparkles, Camera, Lock } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface QRScannerProps {
    onScan: (decodedText: string) => void
    isProcessing?: boolean
}

export default function QRScanner({ onScan, isProcessing = false }: QRScannerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCameraActive, setIsCameraActive] = useState(false)
    const [permissionError, setPermissionError] = useState(false)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    useEffect(() => {
        // Reset state when dialog closes
        if (!isOpen) {
            setIsCameraActive(false)
            setPermissionError(false)
        }
    }, [isOpen])

    useEffect(() => {
        if (isOpen && isCameraActive && !scannerRef.current) {
            const timer = setTimeout(() => {
                if (document.getElementById('reader')) {
                    const scanner = new Html5QrcodeScanner(
                        "reader",
                        { fps: 10, qrbox: { width: 250, height: 250 } },
                        false
                    );
                    scanner.render(onScanSuccess, onScanFailure);
                    scannerRef.current = scanner
                }
            }, 100)
            return () => clearTimeout(timer)
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
                scannerRef.current = null
            }
        }
    }, [isOpen, isCameraActive])

    const handleEnableCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true })
            // Permission granted. Stop the stream so the library can use it cleanly
            stream.getTracks().forEach(track => track.stop())
            
            setIsCameraActive(true)
            setPermissionError(false)
        } catch (error) {
            console.error('Camera permission denied:', error)
            setPermissionError(true)
        }
    }

    const onScanSuccess = (decodedText: string) => {
        if (scannerRef.current) {
            scannerRef.current.pause()
        }
        setIsOpen(false)
        onScan(decodedText)
    }

    const onScanFailure = (error: any) => {
        // Silently ignore scan failures (camera noise, etc.)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    size="lg"
                    className="w-full gap-3 text-lg h-16 bg-gradient-to-r from-primary via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-600 hover:to-primary text-black font-bold shadow-xl shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <div className="relative">
                        <QrCode className="w-7 h-7" />
                        <Sparkles className="w-3 h-3 absolute -top-1 -right-1 animate-pulse" />
                    </div>
                    Escanear Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-gradient-to-b from-zinc-900 to-black border-primary/30 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-bold bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
                        Escanear Código QR
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center justify-center min-h-[320px] py-4">
                    {isProcessing ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-primary/20 animate-ping absolute" />
                                <Loader2 className="w-16 h-16 text-primary animate-spin relative" />
                            </div>
                            <p className="text-muted-foreground text-lg">Procesando...</p>
                        </div>
                    ) : !isCameraActive ? (
                        <div className="flex flex-col items-center text-center p-4 space-y-6 max-w-[280px]">
                            {permissionError ? (
                                <>
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-2">
                                        <Lock className="w-8 h-8 text-red-500" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-lg text-white">Acceso denegado</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Parece que la cámara está bloqueada. Podés habilitarla en la configuración de tu navegador para seguir.
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleEnableCamera}
                                        variant="outline"
                                        className="w-full border-red-500/30 hover:bg-red-500/10 hover:text-red-500"
                                    >
                                        Intentar de nuevo
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mb-2">
                                        <Camera className="w-10 h-10 text-primary" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-xl text-white">Modo Admin</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Habilitá la cámara para escanear el código QR del cliente y sumar puntos.
                                        </p>
                                    </div>
                                    <Button 
                                        onClick={handleEnableCamera}
                                        className="w-full bg-gradient-to-r from-primary via-amber-500 to-amber-600 hover:from-amber-500 hover:via-amber-600 hover:to-primary text-black font-bold shadow-lg shadow-primary/20"
                                    >
                                        Activar Cámara
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div
                            id="reader"
                            className="w-full h-full overflow-hidden rounded-xl border-2 border-primary/30 bg-black/50"
                        />
                    )}
                </div>

                <div className="text-center space-y-2 pb-2">
                    <p className="text-sm text-muted-foreground">
                        Apuntá tu cámara al código QR del cliente
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
