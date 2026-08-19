import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import user1 from "@/assets/user1.jpg.asset.json";
import user2 from "@/assets/user2.jpg.asset.json";
import user3 from "@/assets/user3.jpg.asset.json";
import user5 from "@/assets/user5.jpg.asset.json";

const testimonials = [
  {
    name: "Hugo Oliveira",
    role: "Ganhador R$ 5.000",
    text: "Incrível! Ganhei o prêmio principal na segunda raspadinha. O PIX caiu na hora, sem burocracia nenhuma. Super recomendo!",
    img: user1.url,
    rating: 5
  },
  {
    name: "Cecília Santos",
    role: "Usuária Frequente",
    text: "A interface é muito fluida e as animações de raspagem são viciantes. Já ganhei vários prêmios menores que me ajudaram muito.",
    img: user2.url,
    rating: 5
  },
  {
    name: "Carla Barber",
    role: "Ganhadora Smartphone",
    text: "Ganhei um celular na raspadinha de tecnologia! Chegou rápido em casa e todo o processo foi muito transparente.",
    img: user3.url,
    rating: 4
  },
  {
    name: "Irina Silva",
    role: "Nova Participante",
    text: "Melhor site de raspadinhas que já usei. Seguro, rápido e com prêmios reais. A adrenalina de raspar é sensacional!",
    img: user5.url,
    rating: 5
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-24 px-4 bg-surface/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
      
      <div className="mx-auto max-w-7xl relative">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-display font-black tracking-tight mb-4 uppercase italic">
            O QUE DIZEM NOSSOS <span className="text-primary">GANHADORES</span>
          </h2>
          <div className="h-1.5 w-24 bg-primary mx-auto rounded-full" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="surface-card p-6 flex flex-col h-full group hover:border-primary/50 transition-colors"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, idx) => (
                  <Star 
                    key={idx} 
                    className={`size-4 ${idx < t.rating ? 'fill-primary text-primary' : 'text-muted-foreground'}`} 
                  />
                ))}
              </div>

              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 size-8 text-primary/10" />
                <p className="text-sm text-muted-foreground italic leading-relaxed relative z-10">
                  "{t.text}"
                </p>
              </div>

              <div className="mt-auto flex items-center gap-3">
                <div className="size-10 rounded-full border border-primary/30 overflow-hidden ring-2 ring-primary/5 group-hover:ring-primary/20 transition-all">
                  <img src={t.img} alt={t.name} className="size-full object-cover" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">{t.name}</div>
                  <div className="text-[10px] font-black text-primary uppercase tracking-widest">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
