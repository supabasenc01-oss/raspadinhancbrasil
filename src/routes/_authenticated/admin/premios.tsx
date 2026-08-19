import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Gift, TrendingUp, AlertTriangle, CheckCircle2, MoreVertical, Eye, Edit } from "lucide-react";

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
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import { adminPrizesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/premios")({
  head: () => ({
    meta: [
      { title: "Prêmios — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Prêmios da plataforma." },
    ],
  }),
  component: AdminPrizesPage,
});

function AdminPrizesPage() {
  const { data: prizes, isLoading } = useQuery(adminPrizesQuery);

  return (
    <AdminShell 
      title="Gestão de Prêmios" 
      description="Monitore o estoque e a distribuição de prêmios por raspadinha."
    >
      <div className="space-y-6">
        <div className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prêmio</TableHead>
                <TableHead>Raspadinha</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Probabilidade</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7} className="h-16 animate-pulse bg-muted/20" />
                  </TableRow>
                ))
              ) : prizes && prizes.length > 0 ? (
                prizes.map((prize: any) => {
                  const percentageUsed = (prize.quantity_total - prize.quantity_remaining) / prize.quantity_total * 100;
                  const isLowStock = prize.quantity_remaining < 5 && prize.quantity_total > 0;

                  return (
                    <TableRow key={prize.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
                            <Gift className="size-5" />
                          </div>
                          <span className="font-bold text-sm">{prize.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {prize.scratch_cards?.name || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-sm">{formatCurrency(prize.value)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="size-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{(prize.probability * 100).toFixed(2)}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                            <span>{prize.quantity_remaining} restantes</span>
                            <span className="text-muted-foreground">{prize.quantity_total} total</span>
                          </div>
                          <Progress value={percentageUsed} className="h-1" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {isLowStock ? (
                          <Badge variant="outline" className="border-warning/50 text-warning bg-warning/5 gap-1">
                            <AlertTriangle className="size-3" /> ESTOQUE BAIXO
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/5 gap-1">
                            <CheckCircle2 className="size-3" /> NORMAL
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-8">
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreVertical className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Nenhum prêmio configurado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AdminShell>
  );
}