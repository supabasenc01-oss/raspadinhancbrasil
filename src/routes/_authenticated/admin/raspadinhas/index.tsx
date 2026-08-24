import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ticket, MoreVertical, Edit, Copy, Eye, Play, Pause, Square, Trash2, TrendingUp, DollarSign, Trophy } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { adminScratchCardsQuery } from "@/lib/queries";
import { callEdgeFunction } from "@/lib/edge-functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/raspadinhas/")({
  head: () => ({
    meta: [
      { title: "Gestão de raspadinhas — RaspaPremium" },
      { name: "description", content: "Cadastre, edite e acompanhe as raspadinhas da plataforma." },
    ],
  }),
  component: AdminScratchCardsPage,
});

function AdminScratchCardsPage() {
  const { data: cards, isLoading, refetch } = useQuery(adminScratchCardsQuery);

  const handleStatusUpdate = async (id: string, status: any) => {
    try {
      // Caminho direto (RLS de staff). Se falhar, tenta a função de servidor.
      const { error } = await supabase
        .from("scratch_cards")
        .update({ status, ...(status === "ACTIVE" ? {} : { is_featured: false }) })
        .eq("id", id);
      if (error) {
        await callEdgeFunction("update-scratch-card-status", { id, status });
      }
      toast.success(`Status atualizado para ${status}`);
      refetch();
    } catch (error: any) {
      toast.error(error.message ?? "Não foi possível atualizar o status");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Excluir definitivamente a raspadinha "${name}"?`)) return;
    try {
      await supabase.from("scratch_card_prizes").delete().eq("scratch_card_id", id);
      const { error } = await supabase.from("scratch_cards").delete().eq("id", id);
      if (error) {
        // Provavelmente há jogadas vinculadas: arquiva para sair do site.
        const { error: archiveError } = await supabase
          .from("scratch_cards")
          .update({ status: "ARCHIVED", is_featured: false })
          .eq("id", id);
        if (archiveError) throw archiveError;
        toast.success("Raspadinha arquivada (possuía jogadas registradas).");
      } else {
        toast.success("Raspadinha excluída");
      }
      refetch();
    } catch (error: any) {
      toast.error(error.message ?? "Não foi possível excluir");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: "border-green-500/50 text-green-500",
      PAUSED: "border-yellow-500/50 text-yellow-500",
      FINISHED: "border-red-500/50 text-red-500",
      DRAFT: "text-muted-foreground",
    };
    return (
      <Badge variant="outline" className={`text-[10px] font-bold ${variants[status] || ""}`}>
        {status}
      </Badge>
    );
  };

  return (
    <AdminShell
      title="Catálogo de Raspadinhas"
      description="Gerencie precificação, visibilidade e acompanhe o desempenho de cada raspadinha."
      actions={
        <Button asChild className="bg-gradient-brand text-primary-foreground">
          <Link to="/admin/raspadinhas/novo">Nova raspadinha</Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="surface-card h-64 animate-pulse" />
      ) : cards && cards.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Raspadinha</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Desempenho</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {card.image_url ? (
                        <img src={card.image_url} alt={card.name} className="size-10 rounded-lg object-cover bg-muted" />
                      ) : (
                        <div className="size-10 rounded-lg bg-muted flex items-center justify-center">
                          <Ticket className="size-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold">{card.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                          {card.slug}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(card.status)}</TableCell>
                  <TableCell>
                    <span className="font-black text-sm">
                      {card.is_free ? "GRÁTIS" : formatCurrency(card.price)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div title="Total de Jogadas" className="flex items-center gap-1 text-[10px] text-primary font-bold">
                        <TrendingUp className="size-3" /> 0
                      </div>
                      <div title="Arrecadação" className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold">
                        <DollarSign className="size-3" /> 0
                      </div>
                      <div title="Prêmios Pagos" className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
                        <Trophy className="size-3" /> 0
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {card.is_featured ? (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">SIM</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Não</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDate(card.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link to="/raspadinha/$slug" params={{ slug: card.slug }}>
                            <Eye className="size-4 mr-2" /> Visualizar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="size-4 mr-2" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="size-4 mr-2" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {card.status !== 'ACTIVE' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(card.id, 'ACTIVE')}>
                            <Play className="size-4 mr-2 text-green-500" /> Ativar
                          </DropdownMenuItem>
                        )}
                        {card.status === 'ACTIVE' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(card.id, 'PAUSED')}>
                            <Pause className="size-4 mr-2 text-yellow-500" /> Pausar
                          </DropdownMenuItem>
                        )}
                        {card.status !== 'FINISHED' && (
                          <DropdownMenuItem onClick={() => handleStatusUpdate(card.id, 'FINISHED')}>
                            <Square className="size-4 mr-2 text-red-500" /> Encerrar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-500 focus:text-red-500"
                          onClick={() => handleDelete(card.id, card.name)}
                        >
                          <Trash2 className="size-4 mr-2" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={<Ticket className="size-6" />}
          title="Nenhuma raspadinha cadastrada"
          description="Crie a primeira raspadinha para começar a montar o catálogo."
          action={
            <Button asChild className="mt-2 bg-gradient-brand text-primary-foreground">
              <Link to="/admin/raspadinhas/novo">Criar raspadinha</Link>
            </Button>
          }
        />
      )}
    </AdminShell>
  );
}
