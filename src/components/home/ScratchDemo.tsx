import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScratchArea } from '@/components/scratch/ScratchArea';
import { Button } from '@/components/ui/button';
import { Zap, Trophy, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useSettings } from '@/hooks/useSettings';
import { useFileUrl } from '@/hooks/useFileUrl';

export function ScratchDemo() {
  const [key, setKey] = useState(0);
  const [finished, setFinished] = useState(false);
  const { logoUrl: rawLogoUrl, siteName } = useSettings();
  const logoUrl = useFileUrl(rawLogoUrl);

  const demoCoverPath = "scratch-cards/3bcce1ac-aa9d-4d46-a39f-0ba8439df938.png";
  const demoResultPath = "prizes/3bcce1ac-aa9d-4d46-a39f-0ba8439df938.png";
  const demoPrizeLabel = "VOCÊ GANHOU: R$ 1.000 NO PIX";

  const demoCover = useFileUrl(demoCoverPath);
  const demoResult = useFileUrl(demoResultPath);

  const handleComplete = () => {
    setFinished(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#F59E0B', '#10B981', '#ffffff']
    });
  };

  const reset = () => {
    setKey(prev => prev + 1);
    setFinished(false);
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-black/40">
      {/* Dynamic Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-black tracking-widest uppercase">
              <Zap className="size-4 fill-current" />
              DEMONSTRAÇÃO REAL
            </div>
            
            <h2 className="text-6xl md:text-7xl font-display font-black leading-[0.85] tracking-tighter uppercase">
              SINTA A <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-accent animate-gradient-x">ADRENALINA</span> <br />
              DE GANHAR
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl font-medium">
              Experimente agora o motor de raspagem mais tecnológico do Brasil. Rápido, intuitivo e 100% transparente.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-4">
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-surface/40 backdrop-blur-md border border-white/5 hover:border-primary/30 transition-colors group">
                <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <Trophy className="size-7" />
                </div>
                <div>
                  <div className="font-black text-lg uppercase tracking-tight">Prêmios VIP</div>
                  <div className="text-sm text-muted-foreground font-medium">PIX e Itens Exclusivos</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-surface/40 backdrop-blur-md border border-white/5 hover:border-success/30 transition-colors group">
                <div className="size-14 rounded-2xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
                  <Zap className="size-7" />
                </div>
                <div>
                  <div className="font-black text-lg uppercase tracking-tight">Pagamento Express</div>
                  <div className="text-sm text-muted-foreground font-medium">Receba via PIX na hora</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Premium Card Container */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary opacity-30 blur-xl rounded-[3rem] group-hover:opacity-50 transition-opacity duration-500" />
              
              <div className="relative bg-[#0A0A0A] border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-2xl overflow-hidden">
                {/* Branding inside the demo card */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                
                <div className="mb-8 flex flex-col items-center">
                  {logoUrl ? (
                    <img src={logoUrl} alt={siteName} className="h-12 mb-4 drop-shadow-lg" />
                  ) : (
                    <div className="text-2xl font-black tracking-tighter text-primary mb-4 italic uppercase">{siteName}</div>
                  )}
                  <div className="px-6 py-1.5 rounded-full bg-white/5 border border-white/10">
                    <span className="text-sm font-black text-white/70 uppercase tracking-[0.2em]">Raspe para testar</span>
                  </div>
                </div>

                <div key={key} className="relative z-10">
                  <ScratchArea 
                    coverImage={demoCover || ""}
                    resultImage={demoResult || ""}
                    onComplete={handleComplete}
                    isWinner={true}
                  />
                  
                  {/* Floating Prize Info for Demo */}
                  {finished && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.5, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 w-[90%] pointer-events-none"
                    >
                      <div className="bg-gradient-to-r from-success via-emerald-400 to-success p-[2px] rounded-2xl shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                        <div className="bg-black/90 backdrop-blur-xl px-4 py-4 rounded-[calc(1rem-1px)] text-center">
                          <div className="text-white font-black text-2xl tracking-tighter uppercase italic">
                            {demoPrizeLabel}
                          </div>
                          <div className="text-success text-xs font-bold uppercase tracking-[0.2em] mt-1">
                            Resgatado com sucesso
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                </div>

                <div className="mt-8 flex justify-center">
                  {finished ? (
                    <Button 
                      onClick={reset}
                      size="lg"
                      className="rounded-full px-10 h-14 bg-white text-black hover:bg-white/90 font-black tracking-tighter uppercase group"
                    >
                      <RefreshCw className="mr-3 size-5 group-hover:rotate-180 transition-transform duration-700" />
                      TESTAR NOVAMENTE
                    </Button>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-1 w-24 bg-primary/20 rounded-full overflow-hidden">
                        <motion.div 
                          animate={{ x: [-100, 100] }} 
                          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                          className="h-full w-12 bg-primary" 
                        />
                      </div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">
                        Aguardando raspagem...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
