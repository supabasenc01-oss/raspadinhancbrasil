import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Gift, TrendingUp, AlertTriangle, CheckCircle2, Trash2, Edit, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
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

type PrizeForm = {
  id: string;
  title: string;
  value: string;
  probability: string;
  quantity_total: string;
  quantity_remaining: string;
  is_active: boolean;
  cardSlug?: string | null;
  cardId?: string | null;
};

function AdminPrizesPage() {
  const { data: prizes, isLoading } = useQuery(adminPrizesQuery);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<PrizeForm | null>(null);

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "prizes"] });
    await queryClient.invalidateQueries({ queryKey: ["scratch-card"] });
  };

  const saveMutation = useMutation({
    mutationFn: async (form: PrizeForm) => {
      const total = Math.max(Number(form.quantity_total) || 0, 0);
      const remaining = Math.min(Math.max(Number(form.quantity_remaining) || 0, 0), total);
      const probability = Math.min(Math.max(Number(form.probability) || 0, 0), 100) / 100;
      const { error } = await supabase
        .from("scratch_card_prizes")
        .update({
          title: form.title.trim(),
          value: Number(form.value) || 0,
          probability,
          quantity_total: total,
          quantity_remaining: remaining,
          is_active: form.is_active,
        })
        .eq("id", form.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Prêmio atualizado com sucesso!");
      setEditing(null);
    },
    onError: (error: any) => toast.error(error.message || "Não foi possível salvar o prêmio."),
  });

  const deleteMutation = useMutation({
    mutationFn: async (prizeId: string) => {
      const { error } = await supabase.from("scratch_card_prizes").delete().eq("id", prizeId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await invalidate();
      toast.success("Prêmio removido.");
    },
    onError: (error: any) => toast.error(error.message || "Não foi possível remover o prêmio."),
  });

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
                  const percentageUsed = prize.quantity_total > 0
                    ? ((prize.quantity_total - prize.quantity_remaining) / prize.quantity_total) * 100
                    : 0;
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
                        {prize.is_active === false ? (
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            INATIVO
                          </Badge>
                        ) : isLowStock ? (
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            title="Editar prêmio"
                            onClick={() =>
                              setEditing({
                                id: prize.id,
                                title: prize.title ?? "",
                                value: String(prize.value ?? 0),
                                probability: String(((prize.probability ?? 0) * 100).toFixed(2)),
                                quantity_total: String(prize.quantity_total ?? 0),
                                quantity_remaining: String(prize.quantity_remaining ?? 0),
                                is_active: prize.is_active !== false,
                                cardId: prize.scratch_card_id,
                              })
                            }
                          >
                            <Edit className="size-4" />
                          </Button>
                          {prize.scratch_card_id ? (
                            <Button asChild variant="ghost" size="icon" className="size-8" title="Abrir raspadinha">
                              <Link
                                to="/admin/raspadinhas/$id"
                                params={{ id: prize.scratch_card_id }}
                              >
                                <ExternalLink className="size-4" />
                              </Link>
                            </Button>
                          ) : null}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive"
                            title="Remover prêmio"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (confirm(`Remover o prêmio "${prize.title}"?`)) {
                                deleteMutation.mutate(prize.id);
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
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

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar prêmio</DialogTitle>
            <DialogDescription>
              A probabilidade é em porcentagem (ex.: 10 = 10% de chance). A soma de todos os prêmios de uma
              raspadinha não deve passar de 100%.
            </DialogDescription>
          </DialogHeader>

          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={editing.title}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editing.value}
                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Probabilidade (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editing.probability}
                    onChange={(e) => setEditing({ ...editing, probability: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade total</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editing.quantity_total}
                    onChange={(e) => setEditing({ ...editing, quantity_total: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estoque restante</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editing.quantity_remaining}
                    onChange={(e) => setEditing({ ...editing, quantity_remaining: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-semibold">Prêmio ativo</p>
                  <p className="text-xs text-muted-foreground">Prêmios inativos não são sorteados.</p>
                </div>
                <Switch
                  checked={editing.is_active}
                  onCheckedChange={(checked) => setEditing({ ...editing, is_active: checked })}
                />
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancelar
            </Button>
            <Button
              disabled={saveMutation.isPending || !editing?.title.trim()}
              onClick={() => editing && saveMutation.mutate(editing)}
            >
              {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
