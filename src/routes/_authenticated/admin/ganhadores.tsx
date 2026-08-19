import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Calendar, Ticket, User, Gift, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";


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

export const Route = createFileRoute("/_authenticated/admin/ganhadores")({
  head: () => ({
    meta: [
      { title: "Ganhadores — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Ganhadores da plataforma." },
    ],
  }),
  component: AdminWinnersPage,
});

function AdminWinnersPage() {
  const { data: winners, isLoading } = useQuery({
    queryKey: ["admin", "winners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("winners")
        .select("*, profiles(full_name, email), scratch_cards(name, slug)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    }
  });

  return (
    <AdminShell 
      title="Ganhadores Reais" 
      description="Acompanhe os usuários que foram premiados recentemente."
    >
      <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ganhador</TableHead>
              <TableHead>Raspadinha</TableHead>
              <TableHead>Prêmio</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6} className="h-16 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : winners && winners.length > 0 ? (
              winners.map((winner: any) => (
                <TableRow key={winner.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{winner.profiles?.full_name || "Usuário"}</span>
                        <span className="text-[10px] text-muted-foreground">{winner.profiles?.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Ticket className="size-3 text-muted-foreground" />
                      <span className="text-xs font-medium">{winner.scratch_cards?.name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Gift className="size-3 text-accent" />
                      <span className="text-xs font-bold">{winner.prize_title}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-green-500/30 text-green-500 bg-green-500/5 font-black">
                      {formatCurrency(winner.prize_value)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Calendar className="size-3" /> {formatDate(winner.created_at)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="size-8">
                      <ExternalLink className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhum ganhador registrado ainda.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}
