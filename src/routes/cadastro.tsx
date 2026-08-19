import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/layout/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — RaspaPremium" },
      {
        name: "description",
        content: "Crie sua conta gratuita na RaspaPremium e acompanhe suas raspadinhas.",
      },
      { property: "og:title", content: "Criar conta — RaspaPremium" },
      { property: "og:description", content: "Crie sua conta gratuita na RaspaPremium." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  function update(field: keyof typeof form, value: string) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.password.length < 8) {
      toast.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    setSubmitting(true);
    const { error } = await signUp({
      email: form.email.trim(),
      password: form.password,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
    });
    setSubmitting(false);

    if (error) {
      toast.error("Não foi possível criar a conta", { description: error });
      return;
    }

    toast.success("Conta criada com sucesso!");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <AuthCard
      title="Criar sua conta"
      description="Leva menos de um minuto. Você poderá completar seu perfil depois."
      footer={
        <>
          Já tem conta?{" "}
          <Link to="/login" className="text-primary hover:underline">
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
        <Button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-brand text-primary-foreground"
        >
          {submitting ? "Criando conta..." : "Criar conta"}
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
