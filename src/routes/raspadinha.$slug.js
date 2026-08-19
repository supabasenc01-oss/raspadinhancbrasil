import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AlertCircle, ArrowLeft, CheckCircle2, Info, Loader2, RotateCcw, Sparkles, Ticket, Trophy, Zap, Wallet } from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { PublicPage } from "@/components/layout/PublicPage";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ScratchArea } from "@/components/scratch/ScratchArea";
import { scratchCardBySlugQuery } from "@/lib/queries";
import { playScratchCard } from "@/lib/game.functions";
import { formatCurrency } from "@/lib/format";
import { useAuth } from "@/hooks/useAuth";
import { getWalletBalance } from "@/lib/payments.functions";
import { useServerFn } from "@tanstack/react-start";
export const Route = createFileRoute("/raspadinha/$slug")({
    component: ScratchCardDetailPage,
});
function ScratchCardDetailPage() {
    const { slug } = Route.useParams();
    const { user, isAuthenticated } = useAuth();
    const { data: card, isLoading, error } = useQuery(scratchCardBySlugQuery(slug));
    const fetchBalance = useServerFn(getWalletBalance);
    const { data: balanceData, refetch: refetchBalance } = useQuery({
        queryKey: ['wallet-balance', user?.id],
        queryFn: () => fetchBalance({}),
        enabled: !!user?.id,
    });
    const [gameState, setGameState] = useState("IDLE");
    const [isAutoRevealing, setIsAutoRevealing] = useState(false);
    const [gameResult, setGameResult] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const handleStartGame = async () => {
        if (!user) {
            toast.error("Você precisa estar logado para jogar.");
            return;
        }
        if (!card)
            return;
        setIsProcessing(true);
        try {
            const result = await playScratchCard({ data: { cardId: card.id } });
            if (result.success) {
                // Define Big Win (e.g., value > 1000)
                const isBigWin = result.result_type === "WIN" && (result.prize?.value ?? 0) >= 1000;
                setGameResult({ ...result, isBigWin });
                setGameState("SCRATCHING");
                refetchBalance();
            }
            else {
                toast.error("Não foi possível iniciar a jogada.");
            }
        }
        catch (err) {
            toast.error(err.message || "Erro ao processar a jogada.");
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleScratchComplete = () => {
        setGameState("REVEALED");
        if (gameResult?.result_type === "WIN") {
            triggerConfetti(gameResult?.isBigWin);
        }
    };
    const triggerConfetti = (isBigWin = false) => {
        const duration = (isBigWin ? 6 : 3) * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = {
            startVelocity: isBigWin ? 45 : 30,
            spread: 360,
            ticks: isBigWin ? 100 : 60,
            zIndex: 0,
            colors: isBigWin ? ['#D4AF37', '#FFFFFF', '#00FFFF'] : undefined
        };
        const randomInRange = (min, max) => Math.random() * (max - min) + min;
        const interval = setInterval(function () {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
                return clearInterval(interval);
            }
            const particleCount = (isBigWin ? 100 : 50) * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            if (isBigWin && Math.random() > 0.5) {
                confetti({ ...defaults, particleCount: 20, origin: { x: 0.5, y: 0.5 } });
            }
        }, 250);
    };
    const handleReset = () => {
        setGameState("IDLE");
        setGameResult(null);
        setIsAutoRevealing(false);
    };
    if (isLoading) {
        return (<PublicPage>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="size-8 animate-spin text-primary"/>
        </div>
      </PublicPage>);
    }
    if (error || !card) {
        return (<PublicPage>
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <Alert variant="destructive">
            <AlertCircle className="size-4"/>
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível encontrar esta raspadinha.
            </AlertDescription>
          </Alert>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/raspadinhas"><ArrowLeft className="mr-2 size-4"/> Voltar para o catálogo</Link>
          </Button>
        </div>
      </PublicPage>);
    }
    return (<PublicPage>
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <Button asChild variant="ghost" size="sm" className="mb-6">
          <Link to="/raspadinhas"><ArrowLeft className="mr-2 size-4"/> Voltar</Link>
        </Button>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          {/* Game View */}
          <div className="space-y-6">
            <div className="surface-card p-6 sm:p-10 flex flex-col items-center justify-center min-h-[400px]">
              {gameState === "IDLE" ? (<div className="text-center space-y-6 max-w-sm">
                  <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <Ticket className="size-10"/>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{card.name}</h2>
                    <p className="text-muted-foreground mt-2">
                      {card.is_free ? "Raspadinha Grátis!" : `Valor por jogada: ${formatCurrency(card.price)}`}
                    </p>
                  </div>
                  {isAuthenticated ? (<div className="space-y-4 w-full">
                      <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-surface border border-border/50">
                        <Wallet className="size-4 text-primary"/>
                        <span className="text-sm font-bold">{formatCurrency(balanceData?.balance || 0)}</span>
                      </div>
                      
                      {!card.is_free && (balanceData?.balance || 0) < card.price ? (<div className="space-y-3">
                          <Alert variant="destructive" className="text-left py-2 px-3">
                            <AlertCircle className="size-4"/>
                            <AlertDescription className="text-[10px]">Saldo insuficiente para jogar.</AlertDescription>
                          </Alert>
                          <Button asChild className="w-full h-14 font-black" variant="secondary">
                            <Link to="/carteira/adicionar">ADICIONAR SALDO</Link>
                          </Button>
                        </div>) : (<Button size="lg" className="w-full h-16 text-lg font-black bg-gradient-brand shadow-xl shadow-primary/20" onClick={handleStartGame} disabled={isProcessing}>
                          {isProcessing ? (<Loader2 className="size-6 animate-spin mr-2"/>) : (<Zap className="size-6 mr-2"/>)}
                          {card.is_free ? "RASPAR AGORA" : "COMPRAR E RASPAR"}
                        </Button>)}
                    </div>) : (<Button asChild size="lg" className="w-full bg-gradient-brand">
                      <Link to="/login">FAZER LOGIN PARA JOGAR</Link>
                    </Button>)}
                </div>) : (<div className="w-full space-y-6">
                  <ScratchArea coverImage={card.image_url ?? null} resultImage={gameResult?.prize?.image_url ?? null} onComplete={handleScratchComplete} isAutoRevealing={isAutoRevealing} isWinner={gameResult?.result_type === "WIN"}/>

                  {gameState === "SCRATCHING" && (<div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button size="lg" className="h-14 bg-gradient-brand text-primary-foreground font-black shadow-lg shadow-primary/20" onClick={() => setIsAutoRevealing(true)} disabled={isAutoRevealing}>
                        {isAutoRevealing ? (<Loader2 className="size-5 animate-spin mr-2"/>) : (<Sparkles className="size-5 mr-2"/>)}
                        RASPAR AUTOMATICAMENTE
                      </Button>
                    </div>)}

                  {gameState === "REVEALED" && (<div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
                      {gameResult?.result_type === "WIN" ? (<motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-2">
                          <h3 className={`text-3xl font-black tracking-tighter ${gameResult.isBigWin ? 'text-gradient-brand animate-bounce' : 'text-primary'}`}>
                            {gameResult.isBigWin ? '👑 GRANDE PRÊMIO! 👑' : 'PARABÉNS!'}
                          </h3>
                          <p className="text-lg">Você ganhou <span className="font-bold">{gameResult.prize?.title}</span></p>
                          <motion.div animate={gameResult.isBigWin ? { scale: [1, 1.1, 1] } : {}} transition={{ repeat: Infinity, duration: 1.5 }} className="text-4xl font-display font-black text-primary mt-4 glow-ring inline-block px-6 py-2 rounded-2xl bg-primary/5">
                            {formatCurrency(gameResult.prize?.value ?? 0)}
                          </motion.div>
                        </motion.div>) : (<div className="space-y-2 py-4">
                          <h3 className="text-xl font-bold text-muted-foreground">Não foi desta vez...</h3>
                          <p className="text-sm text-muted-foreground">Tente novamente, a sorte pode estar na próxima!</p>
                        </div>)}
                      
                      <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                        <Button className="bg-gradient-brand text-primary-foreground" onClick={handleReset}>
                          <RotateCcw className="size-4 mr-2"/> JOGAR NOVAMENTE
                        </Button>
                        <Button asChild variant="outline">
                          <Link to="/raspadinhas">OUTRAS RASPADINHAS</Link>
                        </Button>
                      </div>
                    </div>)}
                </div>)}
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <Info className="size-5 text-primary flex-shrink-0"/>
              <p className="text-xs text-muted-foreground">
                O resultado é gerado instantaneamente pelo nosso servidor seguro usando 
                tecnologia de sorteio auditável. A raspagem é apenas uma experiência visual.
              </p>
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="space-y-6">
            <div className="surface-card p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Sobre esta raspadinha</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {card.description || "Esta raspadinha oferece prêmios incríveis e uma experiência emocionante."}
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Prêmios possíveis</h4>
                {/* We would fetch prizes for this card here */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <Trophy className="size-4 text-primary"/>
                      <span className="text-sm font-medium">Prêmio Principal</span>
                    </div>
                    <span className="text-sm font-bold text-primary">R$ 5.000,00</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <Sparkles className="size-4 text-accent"/>
                      <span className="text-sm font-medium">Prêmios Secundários</span>
                    </div>
                    <span className="text-sm font-bold text-primary">Até R$ 1.000,00</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status</span>
                  <span className="flex items-center gap-1.5 text-success font-medium">
                    <CheckCircle2 className="size-3"/> ATIVA
                  </span>
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <h3 className="text-lg font-semibold">Regras do Jogo</h3>
              <ul className="mt-4 space-y-3">
                {[
            "Você deve ter pelo menos 18 anos.",
            "O resultado é determinado pelo servidor.",
            "Prêmios são creditados automaticamente.",
            "Jogue com responsabilidade."
        ].map((rule, i) => (<li key={i} className="flex gap-2 text-sm text-muted-foreground">
                    <span className="text-primary font-bold">•</span>
                    {rule}
                  </li>))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PublicPage>);
}
