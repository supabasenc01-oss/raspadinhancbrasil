import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { formatCurrency, slugify } from "@/lib/format";
import { storesQuery } from "@/lib/stores";

type ScratchStatus = Database["public"]["Enums"]["scratch_card_status"];
type PrizeForm = {
  id?: string;
  title: string;
  description: string;
  value: number;
  probability: number;
  quantity_total: number;
  quantity_remaining: number;
  image_url: string;
  is_active: boolean;
};

type CardForm = {
  name: string;
  slug: string;
  description: string;
  price: number;
  is_free: boolean;
  status: ScratchStatus;
  store_id: string;
  is_featured: boolean;
  image_url: string;
  background_url: string;
  scratch_image_url: string;
  thumbnail_url: string;
  prizes: PrizeForm[];
};

const STATUS_OPTIONS: Array<{ value: ScratchStatus; label: string }> = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "ACTIVE", label: "Ativa" },
  { value: "PAUSED", label: "Pausada" },
  { value: "FINISHED", label: "Encerrada" },
  { value: "ARCHIVED", label: "Arquivada" },
];

const emptyPrize = (index: number): PrizeForm => ({
  title: `Prêmio ${index}`,
  description: "",
  value: 0,
  probability: 0,
  quantity_total: 10,
  quantity_remaining: 10,
  image_url: "",
  is_active: true,
});

export const Route = createFileRoute("/_authenticated/admin/raspadinhas/$id")({
  head: () => ({
    meta: [
      { title: "Editar raspadinha — Painel Administrativo" },
      { name: "description", content: "Edite dados, visibilidade e premiações de uma raspadinha cadastrada." },
      { property: "og:title", content: "Editar raspadinha — Painel Administrativo" },
      { property: "og:description", content: "Edite dados, visibilidade e premiações de uma raspadinha cadastrada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EditScratchCardPage,
});

function EditScratchCardPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CardForm | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const { data: stores } = useQuery(storesQuery);

  const { data: card, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "scratch-card", id],
    retry: 1,
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from("scratch_cards")
        .select("*, scratch_card_prizes(*)")
        .eq("id", id)
        .maybeSingle();
      if (queryError) throw queryError;
      if (!data) throw new Error("Raspadinha não encontrada.");
      return data;
    },
  });

  useEffect(() => {
    if (!card) return;
    // Só inicializa uma vez por raspadinha, para não descartar edições em andamento.
    if (loadedId === card.id) return;

    const prizes = [...(card.scratch_card_prizes ?? [])]
      .sort((first, second) => first.created_at.localeCompare(second.created_at))
      .map((prize) => ({
        id: prize.id,
        title: prize.title,
        description: prize.description ?? "",
        value: Number(prize.value ?? 0),
        probability: Number(prize.probability ?? 0),
        quantity_total: Number(prize.quantity_total ?? 0),
        quantity_remaining: Number(prize.quantity_remaining ?? 0),
        image_url: prize.image_url ?? "",
        is_active: Boolean(prize.is_active),
      }));

    setForm({
      name: card.name,
      slug: card.slug,
      description: card.description ?? "",
      price: Number(card.price ?? 0),
      is_free: Boolean(card.is_free),
      status: card.status,
      store_id: card.store_id ?? "",
      is_featured: Boolean(card.is_featured),
      image_url: card.image_url ?? "",
      background_url: card.background_url ?? "",
      scratch_image_url: card.scratch_image_url ?? "",
      thumbnail_url: card.thumbnail_url ?? "",
      prizes: prizes.length > 0 ? prizes : [emptyPrize(1)],
    });
    setLoadedId(card.id);
  }, [card, loadedId]);


  const saveMutation = useMutation({
    mutationFn: async (values: CardForm) => {
      const cleanedSlug = slugify(values.slug || values.name);
      if (!cleanedSlug) throw new Error("Informe um slug válido.");
      if (values.prizes.length === 0) throw new Error("Adicione pelo menos um prêmio.");

      const totalProbability = values.prizes.reduce((total, prize) => total + safeNumber(prize.probability), 0);
      if (totalProbability > 1) throw new Error("A soma das probabilidades não pode passar de 100%.");

      const { error: cardError } = await supabase
        .from("scratch_cards")
        .update({
          name: values.name.trim(),
          slug: cleanedSlug,
          description: values.description.trim() || null,
          price: safeNumber(values.price),
          is_free: values.is_free,
          status: values.status,
          store_id: values.store_id || null,
          is_featured: values.status === "ACTIVE" ? values.is_featured : false,
          image_url: values.image_url.trim() || null,
          background_url: values.background_url.trim() || null,
          scratch_image_url: values.scratch_image_url.trim() || null,
          thumbnail_url: values.thumbnail_url.trim() || null,
        })
        .eq("id", id);

      if (cardError) throw cardError;

      const originalPrizeIds = new Set((card?.scratch_card_prizes ?? []).map((prize) => prize.id));
      const nextPrizeIds = new Set(values.prizes.map((prize) => prize.id).filter((prizeId): prizeId is string => Boolean(prizeId)));
      const removedPrizeIds = [...originalPrizeIds].filter((prizeId) => !nextPrizeIds.has(prizeId));

      if (removedPrizeIds.length > 0) {
        const { error } = await supabase.from("scratch_card_prizes").delete().in("id", removedPrizeIds);
        if (error) throw error;
      }

      for (const prize of values.prizes) {
        const payload = {
          title: prize.title.trim(),
          description: prize.description.trim() || null,
          value: safeNumber(prize.value),
          probability: safeNumber(prize.probability),
          quantity_total: Math.max(1, Math.round(safeNumber(prize.quantity_total))),
          quantity_remaining: Math.max(0, Math.round(safeNumber(prize.quantity_remaining))),
          image_url: prize.image_url.trim() || null,
          is_active: prize.is_active,
        };

        if (prize.id) {
          const { error } = await supabase.from("scratch_card_prizes").update(payload).eq("id", prize.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("scratch_card_prizes")
            .insert({ ...payload, scratch_card_id: id });
          if (error) throw error;
        }
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "scratch-cards"] });
      queryClient.invalidateQueries({ queryKey: ["scratch-cards"] });
      toast.success("Raspadinha atualizada com sucesso!");
      // Recarrega os prêmios (com os novos ids) mantendo o admin na tela de edição.
      setLoadedId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin", "scratch-card", id] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível salvar a raspadinha.");
    },
  });

  if (error) {
    return (
      <AdminShell title="Editar Raspadinha">
        <div className="surface-card space-y-4 p-6 text-center">
          <p className="font-bold">Não foi possível abrir esta raspadinha</p>
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              Tentar novamente
            </Button>
            <Button onClick={() => navigate({ to: "/admin/raspadinhas" })}>Voltar</Button>
          </div>
        </div>
      </AdminShell>
    );
  }

  if (isLoading || !form) {
    return (
      <AdminShell title="Editar Raspadinha">
        <div className="surface-card h-72 animate-pulse" />
      </AdminShell>
    );
  }


  const totalProbability = form.prizes.reduce((total, prize) => total + safeNumber(prize.probability), 0);

  return (
    <AdminShell title="Editar Raspadinha" description="Atualize informações, visibilidade e tabela de premiação.">
      <div className="space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/admin/raspadinhas" })}>
          <ArrowLeft className="mr-2 size-4" /> Voltar para raspadinhas
        </Button>

        <Card className="bg-surface border-border/50">
          <CardHeader>
            <CardTitle>Dados da raspadinha</CardTitle>
            <CardDescription>O status “Ativa” deixa a raspadinha visível no site.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nome" htmlFor="scratch_name">
                <Input id="scratch_name" value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
              </Field>
              <Field label="Slug" htmlFor="scratch_slug">
                <Input id="scratch_slug" value={form.slug} onChange={(event) => updateForm("slug", slugify(event.target.value))} />
              </Field>
            </div>

            <Field label="Descrição" htmlFor="scratch_description">
              <Textarea id="scratch_description" value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Field label="Preço por jogada" htmlFor="scratch_price">
                <Input id="scratch_price" type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateForm("price", toNumber(event.target.value))} />
              </Field>
              <Field label="Status" htmlFor="scratch_status">
                <Select value={form.status} onValueChange={(value) => updateForm("status", value as ScratchStatus)}>
                  <SelectTrigger id="scratch_status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Filial (loja)" htmlFor="scratch_store">
                <Select value={form.store_id || "none"} onValueChange={(value) => updateForm("store_id", value === "none" ? "" : value)}>
                  <SelectTrigger id="scratch_store"><SelectValue placeholder="Selecione a filial" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem filial definida</SelectItem>
                    {(stores ?? []).map((store) => (
                      <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-end gap-3 pb-2">
                <Switch checked={form.is_free} onCheckedChange={(checked) => updateForm("is_free", checked)} id="scratch_free" />
                <Label htmlFor="scratch_free">Raspadinha grátis</Label>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <ImageUploadField
                id="scratch_image_url"
                label="Imagem de capa"
                value={form.image_url}
                onChange={(value) => updateForm("image_url", value)}
                prefix="capas"
              />
              <ImageUploadField
                id="scratch_background_url"
                label="Imagem de fundo"
                value={form.background_url}
                onChange={(value) => updateForm("background_url", value)}
                bucket="scratch-cards-backgrounds"
              />
              <ImageUploadField
                id="scratch_cover_url"
                label="Imagem para raspar"
                value={form.scratch_image_url}
                onChange={(value) => updateForm("scratch_image_url", value)}
                prefix="raspagem"
                hint="Esta é a imagem que o usuário raspa para revelar o prêmio."
              />
            </div>


            <div className="flex items-center gap-3 rounded-xl border border-border/60 p-4">
              <Switch checked={form.is_featured && form.status === "ACTIVE"} disabled={form.status !== "ACTIVE"} onCheckedChange={(checked) => updateForm("is_featured", checked)} id="scratch_featured" />
              <div>
                <Label htmlFor="scratch_featured">Destaque na home</Label>
                <p className="text-xs text-muted-foreground">Disponível somente quando o status estiver ativo.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border/50">
          <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Prêmios e probabilidades</CardTitle>
              <CardDescription>
                {form.prizes.length} prêmio(s) • Probabilidade total: {(totalProbability * 100).toFixed(2)}%
                {totalProbability > 1 ? " (acima de 100%, ajuste antes de salvar)" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => addPrizes(1)}>
                <Plus className="mr-2 size-4" /> Adicionar prêmio
              </Button>
              <Button type="button" variant="outline" onClick={() => addPrizes(10)}>
                <Plus className="mr-2 size-4" /> +10 prêmios
              </Button>
              <Button type="button" variant="secondary" onClick={distributeProbabilities}>
                Distribuir probabilidades
              </Button>
              <Button type="button" variant="secondary" onClick={restockPrizes}>
                Repor estoque
              </Button>

            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {form.prizes.map((prize, index) => (
              <div key={prize.id ?? `new-${index}`} className="rounded-xl border border-border/60 bg-background/40 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <Badge variant="outline">Prêmio {index + 1}</Badge>
                  <Button type="button" variant="ghost" size="icon" className="text-destructive" disabled={form.prizes.length === 1} onClick={() => removePrize(index)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-6">
                  <div className="md:col-span-2">
                    <Field label="Título" htmlFor={`prize_title_${index}`}>
                      <Input id={`prize_title_${index}`} value={prize.title} onChange={(event) => updatePrize(index, "title", event.target.value)} />
                    </Field>
                  </div>
                  <Field label="Valor" htmlFor={`prize_value_${index}`}>
                    <Input id={`prize_value_${index}`} type="number" min="0" step="0.01" value={prize.value} onChange={(event) => updatePrize(index, "value", toNumber(event.target.value))} />
                  </Field>
                  <Field label="Chance de ganhar (%)" htmlFor={`prize_probability_${index}`}>
                    <div className="relative">
                      <Input
                        id={`prize_probability_${index}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        className="pr-8"
                        value={Number((safeNumber(prize.probability) * 100).toFixed(2))}
                        onChange={(event) => updatePrize(index, "probability", toNumber(event.target.value) / 100)}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">%</span>
                    </div>
                  </Field>
                  <Field label="Total" htmlFor={`prize_total_${index}`}>
                    <Input id={`prize_total_${index}`} type="number" min="1" value={prize.quantity_total} onChange={(event) => updatePrize(index, "quantity_total", toNumber(event.target.value))} />
                  </Field>
                  <Field label="Restantes" htmlFor={`prize_remaining_${index}`}>
                    <Input id={`prize_remaining_${index}`} type="number" min="0" value={prize.quantity_remaining} onChange={(event) => updatePrize(index, "quantity_remaining", toNumber(event.target.value))} />
                  </Field>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <ImageUploadField
                    id={`prize_image_${index}`}
                    label="Imagem do prêmio"
                    value={prize.image_url}
                    onChange={(value) => updatePrize(index, "image_url", value)}
                    bucket="prizes"
                    hint="Imagem revelada quando o usuário ganha este prêmio."
                  />

                  <div className="flex items-center gap-3 pb-2">
                    <Switch checked={prize.is_active} onCheckedChange={(checked) => updatePrize(index, "is_active", checked)} id={`prize_active_${index}`} />
                    <Label htmlFor={`prize_active_${index}`}>Ativo</Label>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="sticky bottom-4 flex justify-end">
          <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending} className="bg-gradient-brand text-primary-foreground shadow-lg">
            {saveMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
            Salvar alterações
          </Button>
        </div>
      </div>
    </AdminShell>
  );

  function updateForm<Key extends keyof CardForm>(key: Key, value: CardForm[Key]) {
    setForm((current) => current ? { ...current, [key]: value } : current);
  }

  function addPrizes(amount: number) {
    setForm((current) => {
      if (!current) return current;
      const extras = Array.from({ length: amount }, (_, offset) => emptyPrize(current.prizes.length + offset + 1));
      return { ...current, prizes: [...current.prizes, ...extras] };
    });
  }

  function restockPrizes() {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        prizes: current.prizes.map((prize) => ({
          ...prize,
          quantity_remaining: Math.max(1, Math.round(safeNumber(prize.quantity_total))),
        })),
      };
    });
  }

  function distributeProbabilities() {

    setForm((current) => {
      if (!current || current.prizes.length === 0) return current;
      const share = Number((1 / current.prizes.length).toFixed(4));
      return { ...current, prizes: current.prizes.map((prize) => ({ ...prize, probability: share })) };
    });
  }


  function updatePrize<Key extends keyof PrizeForm>(index: number, key: Key, value: PrizeForm[Key]) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        prizes: current.prizes.map((prize, prizeIndex) => (
          prizeIndex === index ? { ...prize, [key]: value } : prize
        )),
      };
    });
  }

  function removePrize(index: number) {
    setForm((current) => {
      if (!current || current.prizes.length === 1) return current;
      return { ...current, prizes: current.prizes.filter((_, prizeIndex) => prizeIndex !== index) };
    });
  }
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

function safeNumber(value: number) {
  return Number.isFinite(value) ? value : 0;
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}