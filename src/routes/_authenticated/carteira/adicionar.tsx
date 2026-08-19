import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  ArrowLeft, 
  CreditCard, 
  CheckCircle2, 
  Loader2,
  Copy,
  QrCode,
  Zap
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useServerFn } from '@tanstack/react-start';
import { createPayment } from '@/lib/payments.functions';
import { formatCurrency } from '@/lib/format';
import { toast } from 'sonner';

export const Route = createFileRoute('/_authenticated/carteira/adicionar')({
  component: AddBalancePage,
});

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500, 1000];

function AddBalancePage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const processPayment = useServerFn(createPayment);

  const handleCreatePayment = async () => {
    if (!paymentMethod) return;
    
    setIsProcessing(true);
    try {
      const result = await processPayment({ 
        data: { 
          amount: customAmount ? Number(customAmount) : amount, 
          paymentMethod 
        } 
      });
      
      setPaymentResult(result);
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerar pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyPix = () => {
    if (paymentResult?.qrCode) {
      navigator.clipboard.writeText(paymentResult.qrCode);
      toast.success("Código Pix copiado!");
    }
  };

  if (paymentResult) {
    return (
      <div className="container max-w-md mx-auto py-12 px-4 space-y-8">
        <div className="text-center space-y-4">
          <div className="size-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="size-10" />
          </div>
          <h1 className="text-2xl font-black">Pagamento Gerado!</h1>
          <p className="text-muted-foreground">Siga as instruções abaixo para completar seu depósito de <span className="text-white font-bold">{formatCurrency(amount)}</span>.</p>
        </div>

        {paymentResult.qrCode ? (
          <div className="surface-card p-6 rounded-3xl space-y-6">
            <div className="aspect-square bg-white rounded-2xl flex items-center justify-center p-4">
              {/* No mundo real aqui renderizaríamos o QR Code real */}
              <div className="text-black text-center space-y-2">
                <QrCode className="size-48 mx-auto" />
                <p className="text-[10px] font-mono break-all opacity-50 px-4">{paymentResult.qrCode.substring(0, 50)}...</p>
              </div>
            </div>

            <div className="space-y-3">
              <Button className="w-full h-12" onClick={copyPix}>
                <Copy className="mr-2 size-4" /> COPIAR PIX COPIA E COLA
              </Button>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                  <Loader2 className="size-3 animate-spin" /> Aguardando confirmação do pagamento...
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="surface-card p-6 rounded-3xl text-center space-y-4">
            <CreditCard className="size-12 mx-auto text-primary" />
            <p className="text-sm">Processando pagamento via cartão...</p>
            <p className="text-xs text-muted-foreground">Você será notificado assim que o pagamento for aprovado.</p>
          </div>
        )}

        <Button variant="ghost" className="w-full" onClick={() => navigate({ to: '/carteira' })}>
          VOLTAR PARA CARTEIRA
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 space-y-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/carteira' })}>
          <ArrowLeft className="size-6" />
        </Button>
        <h1 className="text-3xl font-black font-display">ADICIONAR <span className="text-primary">SALDO</span></h1>
      </div>

      <div className="space-y-6">
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">1. Escolha o Valor</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_AMOUNTS.map((val) => (
              <Button 
                key={val}
                variant={amount === val && !customAmount ? "default" : "outline"}
                className="h-14 font-bold text-lg rounded-2xl"
                onClick={() => { setAmount(val); setCustomAmount(""); }}
              >
                R$ {val}
              </Button>
            ))}
            <div className="col-span-2 sm:col-span-1">
              <input 
                type="number" 
                placeholder="Outro"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full h-14 bg-surface border border-border rounded-2xl px-4 font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all"
              />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-widest">2. Método de Pagamento</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <button 
              onClick={() => setPaymentMethod('pix')}
              className={`p-6 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${
                paymentMethod === 'pix' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-surface/50'
              }`}
            >
              <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary">
                <Zap className="size-6" />
              </div>
              <div>
                <div className="font-bold text-lg">PIX</div>
                <div className="text-xs text-muted-foreground">Liberação instantânea</div>
              </div>
            </button>

            <button 
              onClick={() => setPaymentMethod('credit_card')}
              className={`p-6 rounded-3xl border-2 transition-all text-left flex items-start gap-4 ${
                paymentMethod === 'credit_card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-surface/50'
              }`}
            >
              <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-primary">
                <CreditCard className="size-6" />
              </div>
              <div>
                <div className="font-bold text-lg">CARTÃO</div>
                <div className="text-xs text-muted-foreground">Crédito ou Débito</div>
              </div>
            </button>
          </div>
        </section>

        <div className="pt-6">
          <Button 
            size="lg" 
            className="w-full h-16 text-lg font-black bg-gradient-brand shadow-xl shadow-primary/20"
            disabled={!paymentMethod || isProcessing}
            onClick={handleCreatePayment}
          >
            {isProcessing ? (
              <Loader2 className="size-6 animate-spin" />
            ) : (
              <>CONFIRMAR PAGAMENTO DE {formatCurrency(customAmount ? Number(customAmount) : amount)}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
