import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

const SLIDES = [
  {
    id: 1,
    title: "Aqui <span class='text-success'>R$ 1,00</span> pode virar <br/><span class='text-primary'>R$ 2.500</span> no PIX",
    description: "Basta uma raspadinha para mudar sua vida!",
    image: "https://images.unsplash.com/photo-1621504450181-5d356f63d3ee?q=80&w=1974&auto=format&fit=crop",
    cta: "JOGAR AGORA",
    color: "from-primary/20"
  },
  {
    id: 2,
    title: "Cozinha <span class='text-accent'>Premium</span> <br/>e Tech de Ponta",
    description: "Concorra a geladeiras, microondas e batedeiras elétricas.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=2070&auto=format&fit=crop",
    cta: "VER PRÊMIOS",
    color: "from-accent/20"
  },
  {
    id: 3,
    title: "Mega PIX <br/><span class='text-success'>Instantâneo</span>",
    description: "O prêmio cai na sua conta em segundos após raspar.",
    image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=2071&auto=format&fit=crop",
    cta: "QUERO GANHAR",
    color: "from-success/20"
  }
];

export function HomeCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
  const prev = () => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);

  return (
    <div className="relative w-full aspect-[21/9] min-h-[400px] overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent z-10" />
          <div className={`absolute inset-0 bg-gradient-to-t ${SLIDES[current]?.color ?? ""} to-transparent z-10`} />
          <img 
            src={SLIDES[current]?.image ?? ""} 
            className="w-full h-full object-cover scale-105 animate-slow-zoom carousel-image" 
            alt="Promo"
          />
          
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-8 sm:px-20 max-w-4xl space-y-6">
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-4xl sm:text-6xl font-display font-black leading-tight"
              dangerouslySetInnerHTML={{ __html: SLIDES[current]?.title ?? "" }}
            />
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-lg text-muted-foreground max-w-lg"
            >
              {SLIDES[current]?.description ?? ""}
            </motion.p>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Button size="lg" className="bg-gradient-brand text-primary-foreground h-14 px-10 text-lg font-bold group" asChild>
                <Link to="/raspadinhas">
                  {SLIDES[current]?.cta ?? "JOGAR AGORA"}
                  <Zap className="ml-2 size-5 group-hover:scale-110 transition-transform fill-current" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-8 right-8 z-30 flex gap-2">
        <Button variant="outline" size="icon" onClick={prev} className="rounded-full bg-background/20 backdrop-blur-md border-white/10 hover:bg-background/40">
          <ChevronLeft />
        </Button>
        <Button variant="outline" size="icon" onClick={next} className="rounded-full bg-background/20 backdrop-blur-md border-white/10 hover:bg-background/40">
          <ChevronRight />
        </Button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {SLIDES.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrent(i)}
            className={`size-2 rounded-full transition-all ${i === current ? 'w-8 bg-primary' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  );
}
