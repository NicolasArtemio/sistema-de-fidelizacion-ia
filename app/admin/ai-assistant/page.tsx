import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import AiMarketingAgent from '@/components/admin/AiMarketingAgent'

export const metadata = {
  title: 'AI Marketing Agent | Admin Dashboard',
  description: 'AI-powered customer insights and marketing automation',
}

export default function AiAssistantPage() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <Link href="/admin">
          <Button variant="ghost" className="pl-0 hover:pl-2 transition-all text-zinc-400 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Panel
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">AI Marketing Agent</h1>
        <p className="text-zinc-400">
          Growth Hacking impulsado por IA para analizar y fidelizar clientes.
        </p>
      </div>
      
      <AiMarketingAgent />
    </div>
  )
}
