import { motion, AnimatePresence } from "framer-motion";
import { Clock, Medal, Trophy } from "lucide-react";

export function WinnersTicker() {
  const mockWinners = [
    { id: 1, name: "Carlos A.", amount: 500, time: "2 min atrás" },
    { id: 2, name: "Ana P.", amount: 50, time: "5 min atrás" },
    { id: 3, name: "Beto F.", amount: 1000, time: "12 min atrás" },
    { id: 4, name: "Julia M.", amount: 200, time: "15 min atrás" },
    { id: 5, name: "Ricardo S.", amount: 2500, time: "22 min atrás" },
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
            {[...mockWinners, ...mockWinners].map((winner, i) => (
              <div key={i} className="flex items-center gap-3">
                <Medal className="size-4 text-accent" />
                <span className="text-sm font-bold">{winner.name}</span>
                <span className="text-sm text-primary font-black">R$ {winner.amount},00</span>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> {winner.time}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
