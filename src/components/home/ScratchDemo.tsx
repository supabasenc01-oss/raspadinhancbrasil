import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ScratchArea } from '@/components/scratch/ScratchArea';
import { Button } from '@/components/ui/button';
import { Zap, Trophy, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

export function ScratchDemo() {
  const [key, setKey] = useState(0);
  const [finished, setFinished] = useState(false);

  const demoCover = "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=800&auto=format&fit=crop";
  const demoResult = "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?q=80&w=400&auto=format&fit=crop"; // A gold coin/trophy looking image

  const handleComplete = () => {
    setFinished(true);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#F59E0B', '#10B981']
    });
  };

  const reset = () => {
    setKey(prev => prev + 1);
    setFinished(false);
  };

  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold tracking-wider uppercase">
              <Zap className="size-4" />
              Experimente Agora
            </div>
            
            <h2 className="text-5xl md:text-6xl font-display font-black leading-[0.9] tracking-tighter uppercase">
              A EMOÇÃO DE <span className="text-primary">GANHAR</span> <br />
              NA PALMA DA MÃO
            </h2>
            
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              Sinta a textura, ouça o som e descubra prêmios incríveis instantaneamente. Nossa tecnologia de raspagem digital é a mais realista do mercado.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border">
                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Trophy className="size-6" />
                </div>
                <div>
                  <div className="font-bold">Prêmios Reais</div>
                  <div className="text-sm text-muted-foreground">PIX, Eletrônicos e muito mais</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-surface border border-border">
                <div className="size-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
                  <Zap className="size-6" />
                </div>
                <div>
                  <div className="font-bold">Saque Rápido</div>
                  <div className="text-sm text-muted-foreground">Receba em minutos no seu PIX</div>
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
            <div className="absolute -inset-4 bg-gradient-to-r from-primary to-accent opacity-20 blur-2xl rounded-[3rem]" />
            
            <div className="relative bg-surface-2 border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
              <div className="mb-8 text-center">
                <h3 className="text-2xl font-bold mb-2">RASPE AQUI!</h3>
                <p className="text-muted-foreground text-sm">Use o mouse ou o dedo para revelar</p>
              </div>

              <div key={key}>
                <ScratchArea 
                  coverImage={demoCover}
                  resultImage={demoResult}
                  onComplete={handleComplete}
                  isWinner={true}
                />
              </div>

              <div className="mt-8 flex justify-center">
                {finished ? (
                  <Button 
                    onClick={reset}
                    size="lg"
                    className="rounded-full px-8 bg-primary hover:bg-primary/90 text-white font-bold group"
                  >
                    <RefreshCw className="mr-2 size-5 group-hover:rotate-180 transition-transform duration-500" />
                    TENTAR NOVAMENTE
                  </Button>
                ) : (
                  <div className="h-12 flex items-center text-muted-foreground animate-pulse font-medium">
                    Experimente raspar a área acima...
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
