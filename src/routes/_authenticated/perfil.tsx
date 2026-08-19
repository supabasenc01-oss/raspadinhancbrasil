import { createFileRoute } from '@tanstack/react-router'
import { PublicPage } from '@/components/layout/PublicPage'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const Route = createFileRoute('/_authenticated/perfil')({
  component: PerfilPage
})

function PerfilPage() {
  const { profile, user } = useAuth()
  
  return (
    <PublicPage>
      <div className="container max-w-2xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-8">Meu Perfil</h1>
        
        <div className="surface-card p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" value={user?.email || ''} disabled className="bg-secondary/50" />
            <p className="text-[10px] text-muted-foreground italic">O e-mail não pode ser alterado.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <Input id="name" defaultValue={profile?.full_name || ''} placeholder="Seu nome" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone / WhatsApp</Label>
            <Input id="phone" defaultValue={profile?.phone || ''} placeholder="(00) 00000-0000" />
          </div>
          
          <Button className="w-full bg-gradient-brand text-primary-foreground font-bold h-12">
            SALVAR ALTERAÇÕES
          </Button>
        </div>
      </div>
    </PublicPage>
  )
}
