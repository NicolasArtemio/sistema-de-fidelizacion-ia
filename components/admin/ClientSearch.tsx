import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface ClientSearchProps {
    value: string
    onChange: (value: string) => void
}

export default function ClientSearch({ value, onChange }: ClientSearchProps) {
    return (
        <div className="relative w-full max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Buscar por Nombre o WhatsApp..."
                className="pl-9 h-12 md:h-11 w-full bg-zinc-800/50 border-zinc-700/50 focus:border-primary text-sm rounded-xl box-border"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    )
}
