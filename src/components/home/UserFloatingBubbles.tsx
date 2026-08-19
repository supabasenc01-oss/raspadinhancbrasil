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

const users = [
  { id: 1, img: user1.url, name: "Hugo", prize: "R$ 500" },
  { id: 2, img: user2.url, name: "Cecília", prize: "Smartphone" },
  { id: 3, img: user3.url, name: "Carla", prize: "R$ 1.000" },
  { id: 4, img: user4.url, name: "Cale", prize: "Micro-ondas" },
  { id: 5, img: user5.url, name: "Irina", prize: "R$ 250" },
  { id: 6, img: user6.url, name: "Eder", prize: "Geladeira" },
  { id: 7, img: user7.url, name: "Cinthia", prize: "R$ 2.000" },
  { id: 8, img: user8.url, name: "Nico", prize: "Batedeira" },
];

export function UserFloatingBubbles() {
  const [activeUsers, setActiveUsers] = useState<typeof users>([]);

  useEffect(() => {
    // Initial batch
    setActiveUsers(users.slice(0, 3).map(u => ({ ...u, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 })));

    const interval = setInterval(() => {
      setActiveUsers(prev => {
        const next = [...prev];
        if (next.length > 5) next.shift();
        const randomUser = users[Math.floor(Math.random() * users.length)];
        next.push({ 
          ...randomUser, 
          id: Math.random(), // Unique key for animation
          x: Math.random() * 80 + 10, 
          y: Math.random() * 80 + 10 
        } as any);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {activeUsers.map((user: any) => (
          <motion.div
            key={user.id}
            initial={{ scale: 0, opacity: 0, y: 100 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: -100 }}
            transition={{ duration: 0.8, ease: "backOut" }}
            className="absolute flex flex-col items-center"
            style={{ left: `${user.x}%`, top: `${user.y}%` }}
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              <div className="relative size-12 sm:size-16 rounded-full border-2 border-primary/50 overflow-hidden bg-surface shadow-2xl">
                <img src={user.img} alt={user.name} className="size-full object-cover" />
              </div>
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 backdrop-blur-md border border-primary/30 px-3 py-1 rounded-full shadow-xl"
              >
                <span className="text-[10px] font-black text-primary uppercase tracking-tighter">GANHOU!</span>
                <p className="text-xs font-bold text-white">{user.prize}</p>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 size-2 bg-black/80 rotate-45 border-r border-b border-primary/30" />
              </motion.div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
