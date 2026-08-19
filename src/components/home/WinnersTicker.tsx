import { motion, AnimatePresence } from "framer-motion";
import { Clock, Medal, Trophy } from "lucide-react";

interface Winner {
  id: string | number;
  display_name?: string;
  winner_name?: string;
  amount?: number;
  prize_value?: number;
  created_at: string;
}

export function WinnersTicker({ winners }: { winners?: Winner[] }) {
  const displayWinners = winners && winners.length > 0 ? winners : [
    { id: 1, winner_name: "Carlos A.", prize_value: 500, created_at: new Date().toISOString() },
    { id: 2, winner_name: "Ana P.", prize_value: 50, created_at: new Date().toISOString() },
    { id: 3, winner_name: "Beto F.", prize_value: 1000, created_at: new Date().toISOString() },
    { id: 4, winner_name: "Julia M.", prize_value: 200, created_at: new Date().toISOString() },
    { id: 5, winner_name: "Ricardo S.", prize_value: 2500, created_at: new Date().toISOString() },
  ];

  return (
    <div className="w-full bg-surface border-y border-border/50 py-3 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 flex items-center gap-6">
        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest shrink-0">
          <Trophy className="size-4" /> Ao vivo
        </div>
        <div className="flex-1 overflow-hidden relative">
          <motion.div 
            className="flex items-center gap-8 whitespace-nowrap"
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...displayWinners, ...displayWinners].map((winner, i) => (
              <div key={i} className="flex items-center gap-3">
                <Medal className="size-4 text-accent" />
                <span className="text-sm font-bold">{winner.display_name || winner.winner_name}</span>
                <span className="text-sm text-primary font-black">R$ {winner.amount || winner.prize_value},00</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> {new Date(winner.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
