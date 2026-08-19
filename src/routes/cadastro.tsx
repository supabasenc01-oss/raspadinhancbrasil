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
  const { signUp, signInWithGoogle } = useAuth();
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
      const message = error.toLowerCase().includes("user already registered")
        ? "Este e-mail já está cadastrado."
        : error;
      toast.error("Não foi possível criar a conta", { description: message });
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
