import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, ShieldCheck, Ticket, Trophy, User } from "lucide-react";

import { PublicPage } from "@/components/layout/PublicPage";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS, useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/format";
import { userNotificationsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Meu painel — RaspaPremium" },
      { name: "description", content: "Acompanhe seu perfil, notificações e participações." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, user, roles, isStaff } = useAuth();
  const { data: notifications } = useQuery({
    ...userNotificationsQuery(user?.id ?? ""),
    enabled: Boolean(user?.id),
  });

  return (
    <PublicPage>
      <section className="bg-hero-glow border-b border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-12">
          <div>
            <p className="text-xs uppercase tracking-widest text-primary">Meu painel</p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              Olá, {profile?.full_name?.split(" ")[0] ?? "jogador"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sua conta está ativa. Novas funcionalidades chegarão nas próximas etapas.
            </p>
          </div>
          {isStaff && (
            <Button asChild variant="secondary">
              <Link to="/admin">
                <ShieldCheck className="size-4" /> Painel administrativo
              </Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 lg:grid-cols-3">
        <div className="surface-card p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
            <User className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-base font-semibold">Meu perfil</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Nome</dt>
              <dd className="text-right">{profile?.full_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="text-right break-all">{profile?.email ?? user?.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Telefone</dt>
              <dd className="text-right">{profile?.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant="outline" className="text-xs">
                  {profile?.status ?? "—"}
                </Badge>
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Perfis de acesso</dt>
              <dd className="text-right">
                {roles.map((role) => ROLE_LABELS[role]).join(", ") || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Membro desde</dt>
              <dd className="text-right">{formatDate(profile?.created_at)}</dd>
            </div>
          </dl>
        </div>

        <div className="surface-card p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
            <Bell className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-base font-semibold">Notificações</h2>
          {notifications && notifications.length > 0 ? (
            <ul className="mt-4 space-y-3 text-sm">
              {notifications.map((notification) => (
                <li key={notification.id} className="rounded-xl bg-secondary/60 p-3">
                  <p className="font-medium">{notification.title}</p>
                  {notification.message && (
                    <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">
              Você ainda não possui notificações.
            </p>
          )}
        </div>

        <div className="surface-card p-6">
          <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
            <Trophy className="size-5" />
          </span>
          <h2 className="mt-4 font-display text-base font-semibold">Minhas participações</h2>
          <p className="mt-4 text-sm text-muted-foreground">
            O histórico de participações e prêmios será ativado junto com o motor de sorteio.
          </p>
          <Button asChild variant="secondary" size="sm" className="mt-5">
            <Link to="/raspadinhas">
              <Ticket className="size-4" /> Ver raspadinhas
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-12">
        <EmptyState
          title="Carteira e pagamentos em breve"
          description="Esta etapa entrega apenas a fundação da plataforma. Nenhum dado financeiro é exibido."
        />
      </section>
    </PublicPage>
  );
}
