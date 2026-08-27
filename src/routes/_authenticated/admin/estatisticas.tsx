import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, Ticket, Trophy, User } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/estatisticas")({
  head: () => ({
    meta: [
      { title: "Estatísticas de Raspagens — Painel" },
      {
        name: "description",
        content: "Histórico de raspagens, prêmios entregues e estatísticas por raspadinha e por usuário.",
      },
    ],
  }),
  component: AdminStatsPage,
});

function AdminStatsPage() {
  const { data: cardStats, isLoading: loadingCards } = useQuery({
    queryKey: ["admin", "scratch-card-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("scratch_card_stats" as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: userStats, isLoading: loadingUsers } = useQuery({
    queryKey: ["admin", "scratch-user-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("scratch_user_stats" as any);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: plays, isLoading: loadingPlays } = useQuery({
    queryKey: ["admin", "scratch-plays"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("scratch_plays" as any)
        .select("*, scratch_cards(name), profiles:user_id(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) {
        // profiles não tem FK direta com scratch_plays em alguns ambientes
        const fallback = await supabase
          .from("scratch_plays" as any)
          .select("*, scratch_cards(name)")
          .order("created_at", { ascending: false })
          .limit(100);
        if (fallback.error) throw fallback.error;
        return (fallback.data ?? []) as any[];
      }
      return (data ?? []) as any[];
    },
  });

  const totals = (cardStats ?? []).reduce(
    (acc, c: any) => ({
      plays: acc.plays + Number(c.total_plays ?? 0),
      wins: acc.wins + Number(c.total_wins ?? 0),
      value: acc.value + Number(c.total_prize_value ?? 0),
    }),
    { plays: 0, wins: 0, value: 0 },
  );

  return (
    <AdminShell
      title="Estatísticas de Raspagens"
      description="Quantas raspagens foram feitas, quantos prêmios foram entregues e por quem."
    >
      <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Ticket} label="Raspagens totais" value={String(totals.plays)} />
          <StatCard icon={Trophy} label="Prêmios entregues" value={String(totals.wins)} />
          <StatCard icon={BarChart3} label="Valor premiado" value={formatCurrency(totals.value)} />
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            Por raspadinha
          </h2>
          <div className="surface-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raspadinha</TableHead>
                  <TableHead>Raspagens</TableHead>
                  <TableHead>Prêmios dados</TableHead>
                  <TableHead>Valor premiado</TableHead>
                  <TableHead>Estoque de prêmios</TableHead>
                  <TableHead>Última raspagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCards ? (
                  <SkeletonRows cols={6} />
                ) : (cardStats ?? []).length > 0 ? (
                  cardStats!.map((c: any) => (
                    <TableRow key={c.scratch_card_id}>
                      <TableCell className="font-bold text-sm">{c.card_name}</TableCell>
                      <TableCell className="font-black">{c.total_plays}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-accent/40 text-accent">
                          {c.total_wins}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {formatCurrency(Number(c.total_prize_value ?? 0))}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.prizes_remaining} de {c.prizes_total} restantes
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {c.last_play_at ? formatDate(c.last_play_at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow cols={6} text="Nenhuma raspadinha cadastrada." />
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            Por usuário
          </h2>
          <div className="surface-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Raspagens</TableHead>
                  <TableHead>Prêmios</TableHead>
                  <TableHead>Total ganho</TableHead>
                  <TableHead>Última raspagem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingUsers ? (
                  <SkeletonRows cols={5} />
                ) : (userStats ?? []).length > 0 ? (
                  userStats!.map((u: any) => (
                    <TableRow key={u.user_id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 grid place-items-center text-primary shrink-0">
                            <User className="size-4" />
                          </div>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-bold text-sm">
                              {u.full_name || "Usuário"}
                            </span>
                            <span className="truncate text-[10px] text-muted-foreground">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-black">{u.total_plays}</TableCell>
                      <TableCell>{u.total_wins}</TableCell>
                      <TableCell className="font-bold text-primary">
                        {formatCurrency(Number(u.total_prize_value ?? 0))}
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {u.last_play_at ? formatDate(u.last_play_at) : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow cols={5} text="Nenhuma raspagem registrada ainda." />
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground">
            Histórico (últimas 100 raspagens)
          </h2>
          <div className="surface-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Raspadinha</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Prêmio</TableHead>
                  <TableHead>Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPlays ? (
                  <SkeletonRows cols={6} />
                ) : (plays ?? []).length > 0 ? (
                  plays!.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-[10px] text-muted-foreground">
                        {formatDate(p.created_at)}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {p.scratch_cards?.name || "—"}
                      </TableCell>
                      <TableCell className="text-xs">
                        {p.profiles?.full_name || p.profiles?.email || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            p.result_type === "WIN"
                              ? "border-green-500/40 text-green-500"
                              : "text-muted-foreground"
                          }
                        >
                          {p.result_type === "WIN" ? "GANHOU" : "NÃO GANHOU"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold">{p.prize_title || "—"}</TableCell>
                      <TableCell className="text-xs font-black text-primary">
                        {Number(p.prize_value ?? 0) > 0
                          ? formatCurrency(Number(p.prize_value))
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <EmptyRow cols={6} text="Nenhuma raspagem registrada ainda." />
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Ticket;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5">
      <div className="min-w-0">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
        <div className="truncate text-2xl font-black">{value}</div>
      </div>
      <div className="size-10 shrink-0 rounded-xl bg-primary/10 grid place-items-center text-primary">
        <Icon className="size-5" />
      </div>
    </div>
  );
}

function SkeletonRows({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 4 }).map((_, i) => (
        <TableRow key={i}>
          <TableCell colSpan={cols} className="h-14 animate-pulse bg-muted/20" />
        </TableRow>
      ))}
    </>
  );
}

function EmptyRow({ cols, text }: { cols: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={cols} className="h-24 text-center text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  );
}
