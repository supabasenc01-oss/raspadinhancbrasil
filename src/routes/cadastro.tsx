import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, Receipt, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthCard } from "@/components/layout/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { storesQuery, storeName } from "@/lib/stores";

export const Route = createFileRoute("/cadastro")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string | undefined } => {
    return {
      redirect: (search["redirect"] as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Criar conta — Stock Atacarejo Raspadinhas" },
      {
        name: "description",
        content:
          "Cadastre-se informando o número do cupom fiscal e a loja onde comprou para liberar suas raspadinhas.",
      },
      { property: "og:title", content: "Criar conta — Stock Atacarejo Raspadinhas" },
      {
        property: "og:description",
        content: "Cadastre-se com seu cupom fiscal e aguarde a liberação das raspadinhas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { signUp, signInWithGoogle } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    receiptNumber: "",
    storeName: "",
    storeId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [awaitingReview, setAwaitingReview] = useState(false);
  const { data: stores } = useQuery(storesQuery);

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (!form.receiptNumber.trim() || !form.storeId) {
      toast.error("Informe o número do cupom fiscal e selecione a filial onde você comprou.");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp({
      email: form.email.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
    });

    if (error) {
      setSubmitting(false);
      const message = error.toLowerCase().includes("user already registered")
        ? "Este e-mail já está cadastrado."
        : error;
      toast.error("Não foi possível criar a conta", { description: message });
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { error: receiptError } = await supabase.from("receipts").insert({
        user_id: user.id,
        image_url: "PENDENTE_CADASTRO",
        store_name: storeName(stores, form.storeId),
        store_id: form.storeId,
        receipt_number: form.receiptNumber.trim(),
        purchase_value: 0,
        status: "PENDING",
      });
      if (receiptError) {
        toast.error("Conta criada, mas não registramos o cupom fiscal", {
          description:
            receiptError.code === "23505" ||
            receiptError.message.includes("duplicate") ||
            receiptError.message.includes("unique")
            ? "Este cupom fiscal já foi utilizado — cada cupom vale uma única vez, em qualquer filial."
            : receiptError.message,
        });
      }
    }

    setSubmitting(false);
    setAwaitingReview(true);
  }

  if (awaitingReview) {
    return (
      <AuthCard
        title="Cadastro enviado para análise"
        description="Seu cupom fiscal precisa ser verificado pela nossa equipe."
      >
        <div className="space-y-6 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Clock className="size-8" />
          </div>
          <h2 className="text-2xl font-display font-black leading-tight">
            AGUARDE A LIBERAÇÃO DO SEU CUPOM FISCAL
          </h2>
          <p className="text-sm text-muted-foreground">
            Recebemos o cupom <strong>{form.receiptNumber}</strong> da loja{" "}
            <strong>{form.storeName}</strong>. Nossa equipe vai conferir o valor da compra no painel
            e liberar suas raspadinhas. Você poderá raspar somente após essa verificação.
          </p>
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4 text-left text-xs text-muted-foreground">
            <p className="flex items-start gap-2">
              <Receipt className="mt-0.5 size-4 shrink-0 text-primary" />
              Guarde o cupom fiscal original — ele pode ser solicitado na conferência.
            </p>
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
              Assim que o valor for confirmado, as raspadinhas aparecem na sua conta
              automaticamente.
            </p>
          </div>
          <div className="grid gap-2">
            <Button asChild className="w-full bg-gradient-brand text-primary-foreground">
              <Link to="/cupons">Acompanhar meu cupom fiscal</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/">Voltar para o início</Link>
            </Button>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Criar sua conta"
      description="Informe seus dados e o cupom fiscal da sua compra para pré-aprovação."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" search={{ redirect: undefined }} className="text-primary hover:underline">
            Entrar
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="fullName">Nome completo</Label>
          <Input
            id="fullName"
            required
            value={form.fullName}
            onChange={(event) => update("fullName", event.target.value)}
            placeholder="Seu nome"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="voce@email.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Telefone (opcional)</Label>
          <Input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            placeholder="(11) 90000-0000"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="receiptNumber">Número do cupom fiscal *</Label>
          <Input
            id="receiptNumber"
            required
            maxLength={60}
            value={form.receiptNumber}
            onChange={(event) => update("receiptNumber", event.target.value)}
            placeholder="Ex: 000123456"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="storeName">Filial onde você comprou *</Label>
          <select
            id="storeName"
            required
            className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            value={form.storeId}
            onChange={(event) => {
              update("storeId", event.target.value);
              update("storeName", storeName(stores, event.target.value));
            }}
          >
            <option value="">Selecione a filial…</option>
            {(stores ?? []).map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={form.password}
            onChange={(event) => update("password", event.target.value)}
            placeholder="Mínimo de 8 caracteres"
          />
        </div>

        <p className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
          O valor do seu cupom fiscal será conferido pela filial escolhida antes da liberação das
          raspadinhas. Cada cupom fiscal pode ser usado uma única vez, e não é válido em outra
          filial.
        </p>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-brand text-primary-foreground"
        >
          {submitting ? "Criando conta..." : "Criar conta e enviar cupom"}
        </Button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-surface px-2 text-muted-foreground">Ou cadastre-se com</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => signInWithGoogle()}
          className="w-full gap-2 border-border/50 bg-surface/50 hover:bg-surface"
        >
          <svg className="size-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google
        </Button>

        <p className="text-xs text-muted-foreground">
          Ao continuar você concorda com os{" "}
          <Link to="/termos" className="text-primary hover:underline">
            Termos de uso
          </Link>{" "}
          e a{" "}
          <Link to="/privacidade" className="text-primary hover:underline">
            Política de privacidade
          </Link>
          .
        </p>
      </form>
    </AuthCard>
  );
}
