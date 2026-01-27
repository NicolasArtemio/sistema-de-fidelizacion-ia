'use client'

import { QRCodeSVG } from 'qrcode.react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScanLine } from 'lucide-react'

interface ClientQRProps {
    userId: string
    userName: string
}

export default function ClientQR({ userId, userName }: ClientQRProps) {
    // Standardize Data Flow: Use ONLY raw profile.id
    const qrData = String(userId).trim()

    return (
        <Card className="border-primary/20 bg-gradient-to-b from-zinc-900 to-black overflow-hidden shadow-2xl shadow-primary/5">
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl text-primary flex items-center justify-center gap-2">
                    <ScanLine className="w-5 h-5 animate-pulse" />
                    Tu Código Personal
                </CardTitle>
                <CardDescription className="text-base font-medium text-zinc-300">
                    Mostrá este código al barbero para sumar tus puntos
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
                <div className="p-4 bg-white rounded-xl shadow-lg relative group">
                    <QRCodeSVG 
                        value={qrData}
                        size={256}
                        level="M"
                        includeMargin={true}
                        fgColor="#000000"
                        bgColor="#FFFFFF"
                    />
                </div>
                
                <p className="text-[10px] text-zinc-500 font-mono break-all text-center px-4">
                    {userId}
                </p>
            </CardContent>
        </Card>
    )
}
