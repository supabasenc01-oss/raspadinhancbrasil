import { motion } from "framer-motion";
import { Trophy, Clock, Medal } from "lucide-react";
import { useHydrated } from "@/hooks/useHydrated";

interface Winner {
  id: string;
  winner_name: string;
  display_name?: string;
  prize_title: string;
  prize_value: number;
  amount?: number;
  created_at: string;
}

export function WinnersTicker({ winners }: { winners?: Winner[] | null }) {
  const isHydrated = useHydrated();

  if (!winners || winners.length === 0) return null;

  // Duplicate list for seamless loop
  const displayWinners = [...winners, ...winners, ...winners];

  return (
    <div className="w-full bg-surface/50 border-y border-border/50 py-3 overflow-hidden backdrop-blur-sm relative z-10">
      <div className="mx-auto max-w-[2000px] flex items-center">
        <div className="shrink-0 px-6 flex items-center gap-2 border-r border-border/50 mr-6 bg-surface/50 relative z-20">
          <Trophy className="size-4 text-primary animate-pulse" />
          <span className="text-[10px] font-black tracking-widest text-primary uppercase italic">LIVE WINNERS</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative">
          <motion.div 
            className="flex items-center gap-12 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ 
              duration: 40, 
              ease: "linear", 
              repeat: Infinity 
            }}
          >
            {displayWinners.map((winner, i) => (
              <div key={`${winner.id}-${i}`} className="flex items-center gap-3 group">
                <div className="flex items-center gap-2 bg-background/50 px-3 py-1 rounded-full border border-border/30 group-hover:border-primary/30 transition-colors">
                  <Medal className="size-3 text-accent" />
                  <span className="text-sm font-bold text-foreground">
                    {winner.display_name || winner.winner_name}
                  </span>
                  <span className="text-xs text-muted-foreground">ganhou</span>
                  <span className="text-sm font-black text-primary">
                    R$ {winner.amount || winner.prize_value}
                  </span>
                  <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1 ml-2">
                    <Clock className="size-2.5" /> 
                    {isHydrated ? new Date(winner.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "--:--"}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
          
          {/* Fades */}
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
        </div>
      </div>
    </div>
  );
}