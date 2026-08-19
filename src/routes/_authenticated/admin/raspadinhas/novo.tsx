import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "@/lib/format";
import { uploadPlatformFile } from "@/lib/storage";
import type { Database } from "@/integrations/supabase/types";

type CardStatus = Database["public"]["Enums"]["scratch_card_status"];

type PrizeDraft = {
  title: string;
  description: string;
  value: string;
  quantity: string;
  probability: string;
};

const STATUS_OPTIONS: { value: CardStatus; label: string }[] = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "PAUSED", label: "Pausada" },
  { value: "FINISHED", label: "Encerrada" },
  { value: "ARCHIVED", label: "Arquivada" },
];

const EMPTY_PRIZE: PrizeDraft = {
  title: "",
  description: "",
  value: "",
  quantity: "",
  probability: "",
};

export const Route = createFileRoute("/_authenticated/admin/raspadinhas/novo")({
  head: () => ({
    meta: [
      { title: "Nova raspadinha — RaspaPremium" },
      { name: "description", content: "Formulário de cadastro de raspadinhas e prêmios." },
    ],
  }),
  component: NewScratchCardPage,
});

function NewScratchCardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [badge, setBadge] = useState("");
  const [price, setPrice] = useState("");
  const [isFree, setIsFree] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<CardStatus>("DRAFT");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [background, setBackground] = useState<File | null>(null);
  const [prizes, setPrizes] = useState<PrizeDraft[]>([{ ...EMPTY_PRIZE }]);
  const [saving, setSaving] = useState(false);

  function updatePrize(index: number, patch: Partial<PrizeDraft>) {
    setPrizes((current) =>
      current.map((prize, prizeIndex) => (prizeIndex === index ? { ...prize, ...patch } : prize)),
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      toast.error("Informe o nome da raspadinha.");
      return;
    }

    setSaving(true);
    try {
      const finalSlug = slugify(slug || name);

      let imagePath: string | null = null;
      let backgroundPath: string | null = null;

      if (image) {
        const upload = await uploadPlatformFile("scratch-cards", image, finalSlug);
        if (upload.error) throw new Error(`Falha no upload da imagem: ${upload.error}`);
        imagePath = upload.path;
      }

      if (background) {
        const upload = await uploadPlatformFile(
          "scratch-cards-backgrounds",
          background,
          finalSlug,
        );
        if (upload.error) throw new Error(`Falha no upload do fundo: ${upload.error}`);
        backgroundPath = upload.path;
      }

      const { data: card, error } = await supabase
        .from("scratch_cards")
        .insert({
          name: name.trim(),
          slug: finalSlug,
          description: description.trim() || null,
          badge: badge.trim() || null,
          price: isFree ? 0 : Number(price || 0),
          is_free: isFree,
          is_featured: isFeatured,
          status,
          starts_at: startsAt ? new Date(startsAt).toISOString() : null,
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          image_url: imagePath,
          background_url: backgroundPath,
          created_by: user?.id ?? null,
        })
        .select("id, slug")
        .single();

      if (error) throw error;

      const validPrizes = prizes.filter((prize) => prize.title.trim());
      if (validPrizes.length > 0) {
        const { error: prizeError } = await supabase.from("scratch_card_prizes").insert(
          validPrizes.map((prize) => ({
            scratch_card_id: card.id,
            title: prize.title.trim(),
            description: prize.description.trim() || null,
            value: Number(prize.value || 0),
            quantity_total: Number(prize.quantity || 0),
            quantity_remaining: Number(prize.quantity || 0),
            probability: Number(prize.probability || 0),
          })),
        );
        if (prizeError) throw prizeError;
      }

      if (user?.id) {
        await supabase.from("admin_logs").insert({
          actor_id: user.id,
          action: "scratch_card.create",
          entity: "scratch_cards",
          entity_id: card.id,
          new_data: { name: name.trim(), slug: finalSlug, status },
        });
      }

      await queryClient.invalidateQueries();
      toast.success("Raspadinha criada com sucesso.");
      navigate({ to: "/admin/raspadinhas" });
    } catch (submitError) {
      toast.error(
        submitError instanceof Error ? submitError.message : "Não foi possível salvar a raspadinha.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminShell
      title="Nova raspadinha"
      description="Cadastre os dados da raspadinha, imagens e a tabela de prêmios."
    >
      <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="surface-card space-y-4 p-6">
            <h2 className="font-display text-base font-semibold">Informações principais</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Raspadinha Ouro"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder={slugify(name) || "raspadinha-ouro"}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
                placeholder="Explique a mecânica e o que o jogador pode ganhar."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="badge">Selo / etiqueta</Label>
                <Input
                  id="badge"
                  value={badge}
                  onChange={(event) => setBadge(event.target.value)}
                  placeholder="Novo, Mais vendida..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Valor (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  disabled={isFree}
                  placeholder="10.00"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Início</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endsAt">Encerramento</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  value={endsAt}
                  onChange={(event) => setEndsAt(event.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="surface-card space-y-4 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-base font-semibold">Prêmios</h2>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setPrizes((current) => [...current, { ...EMPTY_PRIZE }])}
              >
                <Plus className="size-4" /> Adicionar
              </Button>
            </div>

            {prizes.map((prize, index) => (
              <div key={index} className="rounded-2xl border border-border/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">Prêmio {index + 1}</p>
                  {prizes.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover prêmio ${index + 1}`}
                      onClick={() =>
                        setPrizes((current) =>
                          current.filter((_, prizeIndex) => prizeIndex !== index),
                        )
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Título</Label>
                    <Input
                      value={prize.title}
                      onChange={(event) => updatePrize(index, { title: event.target.value })}
                      placeholder="R$ 100 no PIX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prize.value}
                      onChange={(event) => updatePrize(index, { value: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      min="0"
                      value={prize.quantity}
                      onChange={(event) => updatePrize(index, { quantity: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Probabilidade (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={prize.probability}
                      onChange={(event) => updatePrize(index, { probability: event.target.value })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Descrição</Label>
                    <Input
                      value={prize.description}
                      onChange={(event) => updatePrize(index, { description: event.target.value })}
                      placeholder="Detalhes ou regras do prêmio"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="surface-card space-y-4 p-6">
            <h2 className="font-display text-base font-semibold">Publicação</h2>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as CardStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 p-3">
              <Label htmlFor="isFree" className="text-sm">
                Raspadinha gratuita
              </Label>
              <Switch id="isFree" checked={isFree} onCheckedChange={setIsFree} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 p-3">
              <Label htmlFor="isFeatured" className="text-sm">
                Exibir em destaque na home
              </Label>
              <Switch id="isFeatured" checked={isFeatured} onCheckedChange={setIsFeatured} />
            </div>
          </div>

          <div className="surface-card space-y-4 p-6">
            <h2 className="font-display text-base font-semibold">Imagens</h2>
            <div className="space-y-2">
              <Label htmlFor="image">Capa da raspadinha</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(event) => setImage(event.target.files?.[0] ?? null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="background">Fundo da área raspável</Label>
              <Input
                id="background"
                type="file"
                accept="image/*"
                onChange={(event) => setBackground(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-brand text-primary-foreground"
          >
            {saving ? "Salvando..." : "Salvar raspadinha"}
          </Button>
        </div>
      </form>
    </AdminShell>
  );
}
