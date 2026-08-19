import { createFileRoute, Link } from '@tanstack/react-router'
import { PublicPage } from '@/components/layout/PublicPage'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { useServerFn } from '@tanstack/react-start'
import { getWalletBalance } from '@/lib/payments.functions'
import { formatCurrency } from '@/lib/format'

export const Route = createFileRoute('/_authenticated/carteira/saque')({
  component: SaquePage
})

function SaquePage() {
  const { user } = useAuth()
  const fetchBalance = useServerFn(getWalletBalance)
  
  const { data: balanceData } = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: () => fetchBalance({}),
    enabled: !!user?.id,
  })

  return (
    <PublicPage>
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Link to="/carteira" className="flex items-center gap-2 text-primary text-sm font-bold mb-6 hover:opacity-80 transition-opacity">
          <ArrowLeft className="size-4" /> VOLTAR PARA CARTEIRA
        </Link>
        
        <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Solicitar Saque</h1>
        <p className="text-muted-foreground text-sm mb-8">Retire seus ganhos via PIX com segurança.</p>
        
        <div className="surface-card p-8 space-y-6">
          <div className="bg-secondary/50 p-4 rounded-xl flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground uppercase">Saldo Disponível</span>
            <span className="text-xl font-black text-primary">{formatCurrency(balanceData?.balance || 0)}</span>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Saque</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">R$</span>
              <Input id="amount" type="number" step="0.01" className="pl-12 h-12 text-lg font-bold" placeholder="0,00" />
            </div>
            <p className="text-[10px] text-muted-foreground italic">Saque mínimo: R$ 20,00</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="pix-key">Chave PIX</Label>
            <Input id="pix-key" placeholder="CPF, E-mail, Telefone ou Chave Aleatória" className="h-12" />
          </div>
          
          <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-3">
            <AlertCircle className="size-5 text-orange-500 shrink-0" />
            <p className="text-xs text-orange-200/80 leading-relaxed">
              Os saques são processados em até 24 horas úteis. Certifique-se de que a chave PIX informada pertence ao titular da conta.
            </p>
          </div>
          
          <Button className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold h-12 shadow-lg shadow-green-500/10">
            SOLICITAR SAQUE VIA PIX
          </Button>
        </div>
      </div>
    </PublicPage>
  )
}
