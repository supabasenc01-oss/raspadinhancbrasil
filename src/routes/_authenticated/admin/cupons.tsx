import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Receipt, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { resolveFileUrl } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/lib/format";
import { storesQuery, storeName } from "@/lib/stores";

export const Route = createFileRoute("/_authenticated/admin/cupons")({
  head: () => ({
    meta: [
      { title: "Cupons fiscais — Painel Stock Atacarejo" },
      { name: "description", content: "Analise e aprove os cupons fiscais enviados pelos usuários." },
    ],
  }),
  component: AdminReceiptsPage,
});

type ReceiptRow = {
  id: string;
  user_id: string;
  image_url: string;
  store_name: string | null;
  purchase_value: number;
  purchase_date: string | null;
  receipt_number: string | null;
  status: string;
  credits_granted: number;
  store_id: string | null;
  review_notes: string | null;
  created_at: string;
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: "border-yellow-500/50 text-yellow-500",
  APPROVED: "border-green-500/50 text-green-500",
  REJECTED: "border-red-500/50 text-red-500",
};

function AdminReceiptsPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<ReceiptRow | null>(null);
  const [credits, setCredits] = useState("1");
  const [confirmedValue, setConfirmedValue] = useState("");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [status, setStatus] = useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");


  const { data: stores } = useQuery(storesQuery);

  const { data: receipts, isLoading } = useQuery({
    queryKey: ["admin", "receipts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReceiptRow[];
    },
  });

  const { data: profilesMap } = useQuery({
    queryKey: ["admin", "receipts", "profiles", (receipts ?? []).length],
    enabled: !!receipts && receipts.length > 0,
    queryFn: async () => {
      const ids = Array.from(new Set((receipts ?? []).map((r) => r.user_id)));
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      const map: Record<string, { full_name: string | null; email: string | null }> = {};
      (data ?? []).forEach((row: any) => {
        map[row.id] = { full_name: row.full_name, email: row.email };
      });
      return map;
    },
  });

  const { data: perCredit } = useQuery({
    queryKey: ["settings", "receipts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "receipts")
        .maybeSingle();
      return ((data?.value ?? {}) as { valuePerCredit?: number }).valuePerCredit ?? 100;
    },
  });


  useEffect(() => {
    if (!selected) {
      setImageUrl(null);
      return;
    }
    setStatus(selected.status as "PENDING" | "APPROVED" | "REJECTED");
    setCredits(
      selected.status === "PENDING"
        ? String(Math.max(1, Math.floor(selected.purchase_value / (perCredit ?? 100)) * 2))
        : String(selected.credits_granted),
    );
    setConfirmedValue(selected.purchase_value > 0 ? String(selected.purchase_value) : "");
    setNotes(selected.review_notes ?? "");
    resolveFileUrl(selected.image_url).then(setImageUrl);

  }, [selected, perCredit]);

  const visibleReceipts = (receipts ?? []).filter(
    (receipt) => storeFilter === "ALL" || receipt.store_id === storeFilter,
  );

  const suggestedCredits = Math.max(
    0,
    Math.floor((Number(confirmedValue.replace(",", ".")) || 0) / (perCredit ?? 100)) * 2,
  );

  const review = async (approve: boolean) => {
    if (!selected) return;
    const parsedValue = Number(confirmedValue.replace(",", "."));
    if (approve && (!parsedValue || parsedValue <= 0)) {
      toast.error("Confirme o valor da compra do cupom fiscal antes de liberar.");
      return;
    }
    setSaving(true);
    try {
      if (approve && parsedValue !== selected.purchase_value) {
        const { error: valueError } = await supabase
          .from("receipts")
          .update({ purchase_value: parsedValue })
          .eq("id", selected.id);
        if (valueError) throw valueError;
      }
      const { error } = await supabase.rpc("review_receipt", {
        _receipt_id: selected.id,
        _approve: approve,
        _credits: approve ? Number(credits) || 0 : 0,
        ...(notes ? { _notes: notes } : {}),
      });
      if (error) throw error;
      toast.success(approve ? "Cupom aprovado e raspadinhas liberadas." : "Cupom reprovado.");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "receipts"] });
    } catch (error: any) {
      toast.error(error.message ?? "Não foi possível concluir a análise");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Cupons fiscais"
      description="Analise as fotos enviadas e libere manualmente as raspadinhas de cada usuário."
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Filial
        </span>
        <Button
          size="sm"
          variant={storeFilter === "ALL" ? "default" : "outline"}
          onClick={() => setStoreFilter("ALL")}
        >
          Todas
        </Button>
        {(stores ?? []).map((store) => (
          <Button
            key={store.id}
            size="sm"
            variant={storeFilter === store.id ? "default" : "outline"}
            onClick={() => setStoreFilter(store.id)}
          >
            {store.name}
          </Button>
        ))}
      </div>

      <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cupom</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Loja</TableHead>
              <TableHead>Enviado em</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7} className="h-16 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : visibleReceipts.length > 0 ? (
              visibleReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-lg border border-border bg-surface text-primary">
                        <Receipt className="size-5" />
                      </div>
                      <span className="text-xs font-bold">
                        {receipt.receipt_number || "Sem número"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold">
                        {profilesMap?.[receipt.user_id]?.full_name || "Usuário"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {profilesMap?.[receipt.user_id]?.email || "—"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-black">
                    {formatCurrency(receipt.purchase_value)}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {receipt.store_id ? storeName(stores, receipt.store_id) : receipt.store_name || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(receipt.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-bold ${STATUS_CLASS[receipt.status] ?? ""}`}
                    >
                      {receipt.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setSelected(receipt)}>
                      Analisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                  Nenhum cupom fiscal enviado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Análise do cupom fiscal</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Valor: </span>
                  <strong>{formatCurrency(selected.purchase_value)}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Data da compra: </span>
                  <strong>{selected.purchase_date ?? "—"}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Número: </span>
                  <strong>{selected.receipt_number ?? "—"}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Filial: </span>
                  <strong>
                    {selected.store_id ? storeName(stores, selected.store_id) : selected.store_name ?? "—"}
                  </strong>
                </p>
              </div>

              {imageUrl ? (
                <div className="space-y-2">
                  <img
                    src={imageUrl}
                    alt="Cupom fiscal enviado pelo usuário"
                    className="max-h-72 w-full rounded-xl border border-border object-contain bg-surface"
                  />
                  <a
                    href={imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary"
                  >
                    Abrir em tamanho real <ExternalLink className="size-3" />
                  </a>
                </div>
              ) : (
                <div className="h-40 animate-pulse rounded-xl bg-muted/30" />
              )}

              <div className="space-y-2">
                <Label>Situação do cupom</Label>
                <div className="flex flex-wrap gap-2">
                  {(["PENDING", "APPROVED", "REJECTED"] as const).map((option) => (
                    <Button
                      key={option}
                      type="button"
                      size="sm"
                      variant={status === option ? "default" : "outline"}
                      onClick={() => setStatus(option)}
                    >
                      {option === "PENDING"
                        ? "Pendente"
                        : option === "APPROVED"
                          ? "Aprovado"
                          : "Reprovado"}
                    </Button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Situação atual: {selected.status} — {selected.credits_granted} raspadinha(s)
                  liberada(s). É possível voltar o cupom para análise ou reprovar após aprovação; o
                  saldo do usuário é ajustado automaticamente.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmed-value">Valor confirmado da compra *</Label>
                <Input
                  id="confirmed-value"
                  inputMode="decimal"
                  value={confirmedValue}
                  onChange={(event) => setConfirmedValue(event.target.value)}
                  placeholder="Ex: 250,00"
                />
                <p className="text-[10px] text-muted-foreground">
                  Confira o valor no cupom fiscal antes de liberar. Sugestão de raspadinhas:{" "}
                  {suggestedCredits}.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="credits">Raspadinhas a liberar</Label>
                <Input
                  id="credits"
                  type="number"
                  min={0}
                  value={credits}
                  onChange={(event) => setCredits(event.target.value)}
                  disabled={status !== "APPROVED"}
                />
                <p className="text-[10px] text-muted-foreground">
                  As raspadinhas liberadas valem apenas para as raspadinhas desta filial. Regra
                  atual: 2 raspadinhas a cada {formatCurrency(perCredit ?? 100)} confirmados.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações para o usuário</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Opcional — obrigatório em caso de reprovação"
                />
              </div>
              {selected.status === "PENDING" ? (
                <div className="flex gap-3">
                  <Button
                    disabled={saving}
                    onClick={() => review(true)}
                    className="flex-1 bg-gradient-brand font-bold text-primary-foreground"
                  >
                    {saving && <Loader2 className="mr-2 size-4 animate-spin" />} APROVAR
                  </Button>
                  <Button
                    disabled={saving}
                    variant="outline"
                    onClick={() => review(false)}
                    className="flex-1 border-red-500/50 text-red-500"
                  >
                    REPROVAR
                  </Button>
                </div>
              ) : (
                <Button
                  disabled={saving}
                  onClick={saveEdits}
                  className="w-full bg-gradient-brand font-bold text-primary-foreground"
                >
                  {saving && <Loader2 className="mr-2 size-4 animate-spin" />} SALVAR ALTERAÇÕES
                </Button>
              )}

            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
