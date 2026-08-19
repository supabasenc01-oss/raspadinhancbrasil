import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, Image, Ticket, Users } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import {
  adminBannersQuery,
  adminLogsQuery,
  adminPrizesQuery,
  adminProfilesQuery,
  adminScratchCardsQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard administrativo — RaspaPremium" },
      { name: "description", content: "Visão geral operacional da plataforma." },
    ],
  }),
  component: AdminDashboardPage,
});

function StatCard({
  label,
  value,
  icon: Icon,
  hint,
}: {
  label: string;
  value: string;
  icon: typeof Ticket;
  hint: string;
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-4 font-display text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function AdminDashboardPage() {
  const cards = useQuery(adminScratchCardsQuery);
  const prizes = useQuery(adminPrizesQuery);
  const profiles = useQuery(adminProfilesQuery);
  const banners = useQuery(adminBannersQuery);
  const logs = useQuery(adminLogsQuery);

  const activeCards = (cards.data ?? []).filter((card) => card.status === "ACTIVE").length;

  return (
    <AdminShell
      title="Dashboard"
      description="Números reais lidos diretamente do banco de dados. Métricas financeiras entram na Etapa 2."
      actions={
        <Button asChild className="bg-gradient-brand text-primary-foreground">
          <Link to="/admin/raspadinhas/novo">Nova raspadinha</Link>
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Raspadinhas"
          value={String(cards.data?.length ?? 0)}
          icon={Ticket}
          hint={`${activeCards} ativa(s)`}
        />
        <StatCard
          label="Prêmios cadastrados"
          value={String(prizes.data?.length ?? 0)}
          icon={Gift}
          hint="Somando todas as raspadinhas"
        />
        <StatCard
          label="Usuários"
          value={String(profiles.data?.length ?? 0)}
          icon={Users}
          hint="Perfis criados na plataforma"
        />
        <StatCard
          label="Banners"
          value={String(banners.data?.length ?? 0)}
          icon={Image}
          hint="Conteúdo de vitrine"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold">Últimas raspadinhas</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(cards.data ?? []).slice(0, 5).map((card) => (
              <li key={card.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{card.name}</span>
                <span className="text-xs text-muted-foreground">{card.status}</span>
              </li>
            ))}
            {(cards.data ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhuma raspadinha cadastrada ainda.</li>
            )}
          </ul>
        </div>

        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold">Atividade administrativa</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {(logs.data ?? []).slice(0, 5).map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3">
                <span className="truncate">{log.action}</span>
                <span className="text-xs text-muted-foreground">{formatDate(log.created_at)}</span>
              </li>
            ))}
            {(logs.data ?? []).length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhum registro de auditoria ainda.</li>
            )}
          </ul>
        </div>
      </div>
    </AdminShell>
  );
}
