import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, ShieldCheck, Trophy, User, Wallet, Users } from "lucide-react";

import { PublicPage } from "@/components/layout/PublicPage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { userNotificationsQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";

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
  const { profile, user, isStaff } = useAuth();
  const { data: notifications } = useQuery({
    ...userNotificationsQuery(user?.id ?? ""),
    enabled: Boolean(user?.id),
  });

  // Query para prêmios ganhos
  const { data: prizes } = useQuery({
    queryKey: ['user-prizes', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('winners')
        .select(`
          id,
          prize_title,
          won_at,
          scratch_cards (
            title
          )
        `)
        .eq('user_id', user?.id || '')
        .order('won_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as Array<{
        id: string;
        prize_title: string;
        won_at: string;
        scratch_cards: { title: string } | null;
      }>;
    },
    enabled: !!user?.id,
  });

  return (
    <PublicPage>
      <section className="bg-hero-glow border-b border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-12">
          <div className="flex items-center gap-4">
            <div className="size-16 rounded-full bg-secondary flex items-center justify-center text-primary border-2 border-primary/20">
              <User className="size-8" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-primary font-bold">Meu perfil</p>
              <h1 className="text-2xl font-black sm:text-3xl uppercase tracking-tight">
                {profile?.full_name ?? "Jogador"}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
                  ID: {user?.id.slice(0, 8) ?? ""}
                </Badge>
                {isStaff && (
                  <Badge variant="outline" className="text-orange-500 border-orange-500/20">
                    ADMIN
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/perfil">Editar Dados</Link>
            </Button>
            {isStaff && (
              <Button asChild variant="secondary" size="sm">
                <Link to="/admin">
                  <ShieldCheck className="size-4" /> Painel Admin
                </Link>
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-12 lg:grid-cols-3">
        {/* Prêmios e Conquistas */}
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl font-black uppercase tracking-tight flex items-center gap-2">
                <Trophy className="size-5 text-yellow-500" /> Meus Prêmios
              </h2>
              <Link to="/raspadinhas" className="text-xs text-primary hover:underline font-bold">JOGAR AGORA</Link>
            </div>
            
            {prizes && prizes.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {prizes.map((prize) => (
                  <div key={prize.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {prize.scratch_cards?.title ?? "Raspadinha"}
                      </span>
                      <Badge className="bg-green-500 text-white border-none text-[10px]">GANHOU</Badge>
                    </div>
                    <div className="text-lg font-black text-primary">
                      {prize.prize_title}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {new Date(prize.won_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-secondary/20 rounded-2xl border-2 border-dashed border-border/50">
                <Trophy className="size-12 text-muted-foreground mx-auto mb-3 opacity-20" />
                <p className="text-sm text-muted-foreground font-medium">Você ainda não ganhou prêmios.</p>
                <Button asChild variant="link" className="text-primary font-bold mt-2">
                  <Link to="/raspadinhas">Tentar a sorte agora!</Link>
                </Button>
              </div>
            )}
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-xl font-black uppercase tracking-tight flex items-center gap-2 mb-6">
              <Users className="size-5 text-blue-500" /> Indique e Ganhe
            </h2>
            <div className="bg-gradient-brand p-6 rounded-2xl text-primary-foreground">
              <h3 className="text-lg font-bold mb-2">Convide seus amigos!</h3>
              <p className="text-sm opacity-90 mb-4">
                Ganhe créditos extras para jogar quando seus amigos se cadastrarem e fizerem o primeiro depósito.
              </p>
              <Button asChild variant="secondary" className="w-full font-bold">
                <Link to="/indicacao">MEU LINK DE INDICAÇÃO</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Sidebar info */}
        <div className="space-y-6">
          <div className="surface-card p-6">
            <h2 className="font-display text-base font-black uppercase tracking-tight flex items-center gap-2 mb-4">
              <Wallet className="size-4 text-green-500" /> Financeiro
            </h2>
            <div className="space-y-4">
              <Button asChild className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold h-12 shadow-lg shadow-green-500/10">
                <Link to="/carteira/adicionar">DEPOSITAR AGORA</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 font-bold">
                <Link to="/carteira/saque">SOLICITAR SAQUE</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full text-xs text-muted-foreground">
                <Link to="/carteira">Ver todas as transações</Link>
              </Button>
            </div>
          </div>

          <div className="surface-card p-6">
            <h2 className="font-display text-base font-black uppercase tracking-tight flex items-center gap-2 mb-4">
              <Bell className="size-4 text-primary" /> Notificações
            </h2>
            {notifications && notifications.length > 0 ? (
              <ul className="space-y-3 text-sm">
                {notifications.slice(0, 3).map((notification) => (
                  <li key={notification.id} className="rounded-xl bg-secondary/60 p-3 border border-border/50">
                    <p className="font-bold text-xs">{notification.title}</p>
                    {notification.message && (
                      <p className="mt-1 text-[10px] text-muted-foreground leading-relaxed">{notification.message}</p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Sem notificações recentes.
              </p>
            )}
          </div>
        </div>
      </section>
    </PublicPage>
  );
}
