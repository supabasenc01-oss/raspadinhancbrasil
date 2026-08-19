import { Link } from "@tanstack/react-router";
import { Gift, Ticket } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFileUrl } from "@/hooks/useFileUrl";
import { formatCurrency } from "@/lib/format";
import type { ScratchCard } from "@/lib/queries";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Disponível",
  PAUSED: "Pausada",
  FINISHED: "Encerrada",
  ARCHIVED: "Arquivada",
};

export function ScratchCardTile({ card }: { card: ScratchCard }) {
  const imageUrl = useFileUrl(card.thumbnail_url || card.image_url, undefined, !card.thumbnail_url);

  return (
    <article className="surface-card hover-lift group flex flex-col overflow-hidden">
      <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
        {imageUrl ? (
          <div className="relative size-full">
            <img
              src={imageUrl}
              alt={card.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
            {/* Overlay gradiente dinâmico */}
            <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-transparent to-transparent opacity-60 transition-opacity group-hover:opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-br from-accent/20 via-transparent to-transparent mix-blend-overlay" />
          </div>
        ) : (
          <div className="bg-hero-glow grid size-full place-items-center text-muted-foreground">
            <Ticket className="size-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          {card.badge && (
            <Badge className="border-0 bg-gradient-brand text-primary-foreground">
              {card.badge}
            </Badge>
          )}
          {card.is_free && (
            <Badge variant="secondary" className="border border-accent/40 text-accent">
              Grátis
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-semibold">{card.name}</h3>
          <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
            {STATUS_LABELS[card.status] ?? card.status}
          </Badge>
        </div>

        <p className="line-clamp-2 text-sm text-muted-foreground">
          {card.description ?? "Raspe e descubra o seu prêmio."}
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          <span className="font-display text-lg font-semibold text-primary">
            {card.is_free ? "Grátis" : formatCurrency(card.price)}
          </span>
          <Button asChild size="sm" variant="secondary">
            <Link to="/raspadinha/$slug" params={{ slug: card.slug }}>
              <Gift className="size-4" /> Ver raspadinha
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
