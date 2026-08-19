import { createFileRoute } from '@tanstack/react-router'
import { PublicPage } from '@/components/layout/PublicPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Users, Trophy, Gift } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/indicacao')({
  component: IndicacaoPage
})

function IndicacaoPage() {
  const { user } = useAuth()
  const referralLink = `${window.location.origin}/cadastro?ref=${user?.id.slice(0, 8)}`
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    toast.success('Link de indicação copiado!')
  }
  
  return (
    <PublicPage>
      <div className="container max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black uppercase tracking-tight mb-4">Indique e Ganhe</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Convide seus amigos para a Stock Atacarejo e ganhe bônus exclusivos por cada novo jogador indicado!
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="surface-card p-6 text-center space-y-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
              <Users className="size-6" />
            </div>
            <h3 className="font-bold">1. Convide</h3>
            <p className="text-xs text-muted-foreground">Envie seu link exclusivo para seus amigos e familiares.</p>
          </div>
          
          <div className="surface-card p-6 text-center space-y-4">
            <div className="size-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-500 mx-auto">
              <Gift className="size-6" />
            </div>
            <h3 className="font-bold">2. Cadastrou</h3>
            <p className="text-xs text-muted-foreground">Seu amigo se cadastra e faz o primeiro depósito na plataforma.</p>
          </div>
          
          <div className="surface-card p-6 text-center space-y-4">
            <div className="size-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 mx-auto">
              <Trophy className="size-6" />
            </div>
            <h3 className="font-bold">3. Ganhou</h3>
            <p className="text-xs text-muted-foreground">Você recebe uma porcentagem do valor depositado como bônus.</p>
          </div>
        </div>
        
        <div className="surface-card p-8 max-w-2xl mx-auto border-2 border-primary/20">
          <h2 className="text-xl font-black uppercase tracking-tight mb-6 text-center">Seu Link Exclusivo</h2>
          <div className="flex gap-2">
            <Input value={referralLink} readOnly className="bg-secondary/50 font-mono text-xs" />
            <Button onClick={copyToClipboard} className="bg-gradient-brand text-primary-foreground font-bold shrink-0">
              <Copy className="size-4 mr-2" /> COPIAR
            </Button>
          </div>
        </div>
      </div>
    </PublicPage>
  )
}
