import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthCard } from "@/components/layout/AuthCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/esqueci-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — RaspaPremium" },
      { name: "description", content: "Receba um link para redefinir a senha da sua conta." },
      { property: "og:title", content: "Recuperar senha — RaspaPremium" },
      { property: "og:description", content: "Receba um link para redefinir sua senha." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const { error } = await requestPasswordReset(email.trim());
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar o e-mail", { description: error });
      return;
    }
    setSent(true);
  }

  return (
    <AuthCard
      title="Recuperar senha"
      description="Informe seu e-mail e enviaremos um link para criar uma nova senha."
      footer={
        <Link to="/login" className="text-primary hover:underline">
          Voltar para o login
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-muted-foreground">
          Se existir uma conta com <span className="text-foreground">{email}</span>, o link de
          redefinição já está a caminho. Verifique também a caixa de spam.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
            />
          </div>
          <Button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-brand text-primary-foreground"
          >
            {submitting ? "Enviando..." : "Enviar link"}
          </Button>
        </form>
      )}
    </AuthCard>
  );
}
