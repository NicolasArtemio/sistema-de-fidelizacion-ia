import { getSessionUserProfile } from '@/app/auth-actions'
import { logout, getAtRiskClientCount, getAdminStats } from '@/app/server-actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminScanner from '@/components/admin/AdminScanner'
import ClientManagement from '@/components/admin/ClientManagement'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LogOut, Bot, Sparkles, ArrowRight, AlertTriangle, Users, CalendarCheck, Gift } from 'lucide-react'

export default async function AdminDashboard() {
    const profile = await getSessionUserProfile()

    if (!profile) {
        redirect('/')
    }

    if (profile.role !== 'admin') {
        redirect('/dashboard') // Restricted view
    }

    const atRiskCount = await getAtRiskClientCount()
    const stats = await getAdminStats()

    return (
        <div className="min-h-screen bg-background pb-20">
            <header className="p-4 flex justify-between items-center border-b border-white/5 bg-background/50 backdrop-blur sticky top-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                             <img 
                                 src="/blogo.png?v=1" 
                                 alt="tulook logo" 
                                 className="w-full h-full object-contain"
                             />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg leading-none">tulook</h1>
                            <p className="text-xs text-muted-foreground">Panel de Administración</p>
                        </div>
                    </div>
                    
                    <nav className="hidden md:flex items-center gap-4 border-l border-white/10 pl-6">
                        <Link 
                            href="/admin/ai-assistant" 
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:bg-white/5 px-3 py-1.5 rounded-md"
                        >
                            <Bot className="w-4 h-4" />
                            Asistente IA
                        </Link>
                    </nav>
                </div>
                <form action={logout}>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                        <LogOut className="w-5 h-5" />
                    </Button>
                </form>
            </header>

            <main className="p-4 space-y-6 max-w-4xl mx-auto mt-6">
                
                {atRiskCount > 0 && (
                    <Link href="/admin/ai-assistant">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-red-500/20 transition-all group animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/20 rounded-full">
                                    <AlertTriangle className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <p className="font-bold text-red-100">¡Ojo! {atRiskCount} clientes se están por ir</p>
                                    <p className="text-xs text-red-200/70">Mandales un WhatsApp ahora para que vuelvan.</p>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                )}

                <div className="grid gap-6 md:grid-cols-2">
                    <section>
                        <AdminScanner />
                    </section>

                    <section>
                        <Link href="/admin/ai-assistant">
                            <Card className="h-full bg-gradient-to-br from-indigo-950/30 to-purple-950/10 border-indigo-500/20 hover:border-indigo-500/40 transition-all cursor-pointer group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Bot className="w-24 h-24 text-indigo-500" />
                                </div>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-indigo-100">
                                        <Sparkles className="w-5 h-5 text-indigo-400" />
                                        AI Marketing Agent
                                    </CardTitle>
                                    <CardDescription className="text-indigo-200/60">
                                        Analiza tus clientes y genera estrategias de retención automáticas.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center text-sm text-indigo-300 font-medium group-hover:translate-x-1 transition-transform">
                                        Launch Analysis <ArrowRight className="w-4 h-4 ml-2" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </section>

                    {/* Stats Overview */}
                    <section className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="bg-zinc-900/50 border-white/5">
                            <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                                <div className="p-2 md:p-3 bg-blue-500/10 rounded-full">
                                    <Users className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Clientes</p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.totalClients}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/50 border-white/5">
                            <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                                <div className="p-2 md:p-3 bg-emerald-500/10 rounded-full">
                                    <CalendarCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Visitas</p>
                                    <p className="text-xl md:text-2xl font-bold">{stats.visitsToday}</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-zinc-900/50 border-white/5 col-span-2 md:col-span-1">
                            <CardContent className="p-4 md:p-6 flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4 text-center md:text-left">
                                <div className="p-2 md:p-3 bg-amber-500/10 rounded-full">
                                    <Gift className="w-5 h-5 md:w-6 md:h-6 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-xs md:text-sm text-muted-foreground">Premios</p>
                                    <p className="text-xl md:text-2xl font-bold text-amber-500">{stats.readyForReward}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="md:col-span-2">
                        <ClientManagement />
                    </section>
                </div>
            </main>
        </div>
    )
}
