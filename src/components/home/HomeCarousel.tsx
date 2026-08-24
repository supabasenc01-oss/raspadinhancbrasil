import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";
import { useFileUrl } from "@/hooks/useFileUrl";
import { supabase } from "@/integrations/supabase/client";
import heroBanner from "@/assets/banner-home.jpg.asset.json";

type Banner = {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
};

const bannersQuery = {
  queryKey: ["home-banners"],
  queryFn: async (): Promise<Banner[]> => {
    const { data, error } = await supabase
      .from("banners")
      .select("id,title,image_url,link_url")
      .eq("is_active", true)
      .eq("position", "HOME_HERO")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Banner[];
  },
};

export function HomeCarousel() {
  const { data } = useQuery(bannersQuery);
  const [current, setCurrent] = useState(0);

  const slides: Banner[] =
    data && data.length > 0
      ? data
      : [{ id: "default", title: "Raspou, achou, ganhou!", image_url: heroBanner.url, link_url: "/cadastro" }];

  const slide = slides[Math.min(current, slides.length - 1)]!;
  const next = () => setCurrent((p) => (p + 1) % slides.length);
  const prev = () => setCurrent((p) => (p - 1 + slides.length) % slides.length);

  return (
    <div className="relative w-full overflow-hidden bg-background">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {slide.link_url ? (
            <Link to={slide.link_url as string}>
              <BannerImage src={slide.image_url} alt={slide.title} />
            </Link>
          ) : (
            <BannerImage src={slide.image_url} alt={slide.title} />
          )}
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 && (
        <>
          <div className="absolute bottom-4 right-4 z-30 flex gap-2">
            <Button variant="outline" size="icon" onClick={prev} className="rounded-full bg-background/20 backdrop-blur-md border-white/10">
              <ChevronLeft />
            </Button>
            <Button variant="outline" size="icon" onClick={next} className="rounded-full bg-background/20 backdrop-blur-md border-white/10">
              <ChevronRight />
            </Button>
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setCurrent(i)}
                aria-label={`Banner ${i + 1}`}
                className={`size-2 rounded-full transition-all ${i === current ? "w-8 bg-primary" : "bg-white/30"}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BannerImage({ src, alt }: { src: string | null; alt: string }) {
  const url = useFileUrl(src);
  return (
    <img
      src={url || heroBanner.url}
      alt={alt}
      className="w-full h-auto object-contain"
      onError={(e) => {
        e.currentTarget.src = heroBanner.url;
      }}
    />
  );
}
