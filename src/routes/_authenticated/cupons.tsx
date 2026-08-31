import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Receipt, Upload, Ticket, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { PublicPage } from "@/components/layout/PublicPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatCurrency, formatDate } from "@/lib/format";
import { storesQuery, storeName } from "@/lib/stores";

export const Route = createFileRoute("/_authenticated/cupons")({
  head: () => ({
    meta: [
      { title: "Enviar cupom fiscal — Stock Atacarejo" },
      {
        name: "description",
        content: "Envie a foto do seu cupom fiscal do supermercado e libere raspadinhas para jogar.",
      },
      { property: "og:title", content: "Enviar cupom fiscal — Stock Atacarejo" },
      {
        property: "og:description",
        content: "Compre no supermercado, envie o cupom fiscal e libere suas raspadinhas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReceiptsPage,
});

const STATUS_META: Record<string, { label: string; className: string; icon: typeof Clock }> = {
  PENDING: { label: "EM ANÁLISE", className: "border-yellow-500/50 text-yellow-500", icon: Clock },
  APPROVED: { label: "APROVADO", className: "border-green-500/50 text-green-500", icon: CheckCircle2 },
  REJECTED: { label: "REPROVADO", className: "border-red-500/50 text-red-500", icon: XCircle },
};

function ReceiptsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [store, setStore] = useState("");
  const [value, setValue] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [receiptNumber, setReceiptNumber] = useState("");
  const [storeId, setStoreId] = useState("");

  const { data: stores } = useQuery(storesQuery);

  const { valuePerCredit, receiptsRuleText, instructions, estimateCredits } = useReceiptsRules();


  const { data: credits } = useQuery({
    queryKey: ["scratch-credits", "by-store", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("scratch_credits")
        .select("balance, store_id")
        .eq("user_id", user!.id);
      return (data ?? []) as { balance: number; store_id: string | null }[];
    },
  });

  const totalCredits = (credits ?? []).reduce((sum, row) => sum + Number(row.balance ?? 0), 0);

  const { data: receipts, isLoading } = useQuery({
    queryKey: ["receipts", "mine", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("receipts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Selecione a foto do cupom fiscal.");
      if (!storeId) throw new Error("Selecione a filial onde você fez a compra.");
      if (!receiptNumber.trim()) throw new Error("Informe o número do cupom fiscal.");
      if (!user?.id) throw new Error("Sessão expirada.");
      const parsedValue = Number(value.replace(",", "."));
      if (!parsedValue || parsedValue <= 0) throw new Error("Informe o valor total da compra.");

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const objectPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(objectPath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw new Error(uploadError.message);

      const { error } = await supabase.from("receipts").insert({
        user_id: user.id,
        image_url: `receipts/${objectPath}`,
        store_name: store || null,
        purchase_value: parsedValue,
        purchase_date: purchaseDate || null,
        receipt_number: receiptNumber.trim(),
        store_id: storeId,
        status: "PENDING",
      });
      if (error) {
        throw new Error(
          error.code === "23505" || error.code === "23514" || error.message.includes("duplicate") || error.message.includes("unique")
            ? "Este cupom fiscal já foi utilizado. Cada cupom pode ser usado uma única vez, em qualquer filial."
            : error.message,
        );
      }
    },
    onSuccess: () => {
      toast.success("Cupom enviado! Nossa equipe vai analisar em breve.");
      setFile(null);
      setStore("");
      setValue("");
      setPurchaseDate("");
      setReceiptNumber("");
      setStoreId("");
      queryClient.invalidateQueries({ queryKey: ["receipts", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["scratch-credits"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const estimated = estimateCredits(Number(value.replace(",", ".")) || 0);

  return (
    <PublicPage>
      <div className="mx-auto max-w-4xl px-4 py-12 space-y-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Receipt className="size-3" /> Cupom fiscal
          </div>
          <h1 className="text-3xl font-display font-black tracking-tight">
            ENVIE SEU CUPOM E <span className="text-primary">LIBERE RASPADINHAS</span>
          </h1>
          <p className="text-muted-foreground">
            {settings?.instructions ??
              `Envie a foto do seu cupom fiscal do supermercado. A cada ${formatCurrency(perCredit)} em compras você libera 1 raspadinha após a aprovação da nossa equipe.`}
          </p>
        </div>

        <div className="surface-card flex items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Raspadinhas liberadas
              </p>
              <p className="text-2xl font-black">{totalCredits}</p>
              <p className="text-[10px] text-muted-foreground">
                {(credits ?? [])
                  .filter((row) => Number(row.balance) > 0)
                  .map((row) => `${storeName(stores, row.store_id)}: ${row.balance}`)
                  .join(" · ") || "Nenhuma filial com raspadinhas liberadas"}
              </p>
            </div>
          </div>
          <Button asChild variant="outline">
            <a href="/raspadinhas">Jogar agora</a>
          </Button>
        </div>

        <form
          className="surface-card space-y-5 p-6"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="receipt-file">Foto do cupom fiscal *</Label>
            <Input
              id="receipt-file"
              type="file"
              accept="image/*,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-[10px] italic text-muted-foreground">
              A imagem precisa mostrar o valor total e o número do cupom com nitidez (até 10MB).
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="receipt-value">Valor total da compra *</Label>
              <Input
                id="receipt-value"
                inputMode="decimal"
                placeholder="0,00"
                value={value}
                onChange={(event) => setValue(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt-date">Data da compra</Label>
              <Input
                id="receipt-date"
                type="date"
                value={purchaseDate}
                onChange={(event) => setPurchaseDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt-store">Filial onde comprou *</Label>
              <select
                id="receipt-store"
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
                value={storeId}
                onChange={(event) => {
                  setStoreId(event.target.value);
                  setStore(storeName(stores, event.target.value));
                }}
              >
                <option value="">Selecione a filial…</option>
                {(stores ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt-number">Número do cupom *</Label>
              <Input
                id="receipt-number"
                placeholder="Ex: 000123456"
                value={receiptNumber}
                onChange={(event) => setReceiptNumber(event.target.value)}
              />
            </div>
          </div>

          <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            Cada cupom fiscal pode ser usado <strong>uma única vez</strong> — não é válido em outra
            filial nem em outra raspadinha. As raspadinhas liberadas valem apenas para as
            raspadinhas da filial informada.
          </p>

          {estimated > 0 && (
            <p className="text-xs font-bold text-primary">
              Estimativa: até {estimated} raspadinha(s) após aprovação.
            </p>
          )}

          <Button
            type="submit"
            disabled={submit.isPending}
            className="h-12 w-full bg-gradient-brand font-bold text-primary-foreground"
          >
            {submit.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            ENVIAR CUPOM
          </Button>
        </form>

        <div className="space-y-4">
          <h2 className="text-lg font-bold">Meus cupons enviados</h2>
          {isLoading ? (
            <div className="surface-card h-32 animate-pulse" />
          ) : receipts && receipts.length > 0 ? (
            <div className="space-y-3">
              {receipts.map((receipt) => {
                const meta = STATUS_META[receipt.status] ?? STATUS_META["PENDING"]!;
                const Icon = meta.icon;
                return (
                  <div
                    key={receipt.id}
                    className="surface-card flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div>
                      <p className="font-bold">{formatCurrency(receipt.purchase_value)}</p>
                      <p className="text-xs text-muted-foreground">
                        {receipt.store_name || "Cupom fiscal"} · enviado em {formatDate(receipt.created_at)}
                      </p>
                      {receipt.review_notes && (
                        <p className="mt-1 text-xs text-muted-foreground">{receipt.review_notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {receipt.status === "APPROVED" && (
                        <span className="text-xs font-bold text-primary">
                          +{receipt.credits_granted} raspadinha(s)
                        </span>
                      )}
                      <Badge variant="outline" className={`gap-1 text-[10px] font-bold ${meta.className}`}>
                        <Icon className="size-3" /> {meta.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="surface-card border-2 border-dashed p-10 text-center text-muted-foreground">
              Você ainda não enviou nenhum cupom fiscal.
            </div>
          )}
        </div>
      </div>
    </PublicPage>
  );
}
