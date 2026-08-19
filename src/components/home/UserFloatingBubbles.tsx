import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import user1 from "@/assets/user1.jpg.asset.json";
import user2 from "@/assets/user2.jpg.asset.json";
import user3 from "@/assets/user3.jpg.asset.json";
import user4 from "@/assets/user4.jpg.asset.json";
import user5 from "@/assets/user5.jpg.asset.json";
import user6 from "@/assets/user6.jpg.asset.json";
import user7 from "@/assets/user7.jpg.asset.json";
import user8 from "@/assets/user8.jpg.asset.json";
import { useHydrated } from "@/hooks/useHydrated";
import { Check } from "lucide-react";

interface User {
  id: number;
  img: string;
  name: string;
  prize: string;
  time: string;
}

const users: User[] = [
  { id: 1, img: user1.url, name: "Hugo", prize: "R$ 500", time: "2 min" },
  { id: 2, img: user2.url, name: "Cecília", prize: "Smartphone", time: "5 min" },
  { id: 3, img: user3.url, name: "Carla", prize: "R$ 1.000", time: "12 min" },
  { id: 4, img: user4.url, name: "Cale", prize: "Micro-ondas", time: "15 min" },
  { id: 5, img: user5.url, name: "Irina", prize: "R$ 250", time: "22 min" },
  { id: 6, img: user6.url, name: "Eder", prize: "Geladeira", time: "30 min" },
  { id: 7, img: user7.url, name: "Cinthia", prize: "R$ 2.000", time: "45 min" },
  { id: 8, img: user8.url, name: "Nico", prize: "Batedeira", time: "55 min" },
];

export function UserFloatingBubbles() {
  const isHydrated = useHydrated();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!isHydrated) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % users.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHydrated]);

  if (!isHydrated) return null;

  const currentUser = users[currentIndex];

  if (!currentUser) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] pointer-events-none sm:bottom-10 sm:right-10">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentUser.id}
          initial={{ opacity: 0, x: 50, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.9 }}
          transition={{ duration: 0.5, ease: "circOut" }}
          className="pointer-events-auto"
        >
          <div className="relative flex items-center gap-4 bg-black/80 backdrop-blur-xl border border-primary/30 p-2 pr-6 rounded-full shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            {/* Avatar with Ring */}
            <div className="relative shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary via-accent to-primary rounded-full animate-spin-slow opacity-70" />
              <div className="relative size-12 sm:size-14 rounded-full border-2 border-black overflow-hidden">
                <img 
                  src={currentUser.img} 
                  alt={currentUser.name} 
                  className="size-full object-cover" 
                />
              </div>
              <div className="absolute -bottom-1 -right-1 size-5 bg-success rounded-full border-2 border-black flex items-center justify-center">
                <Check className="size-3 text-white" />
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-primary uppercase tracking-tighter">GANHOU AGORA!</span>
                <span className="text-[10px] text-muted-foreground font-medium">há {currentUser.time}</span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-white leading-none">{currentUser.name}</span>
                <span className="text-xs text-muted-foreground ml-1">levou</span>
                <span className="text-sm font-black text-success leading-none ml-1">{currentUser.prize}</span>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-2 bg-primary/5 rounded-full blur-2xl -z-10" />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}