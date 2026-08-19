import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, Mail, Phone, Calendar, Wallet, TrendingUp, ShoppingBag, Trophy, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { getAdminUsers } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Painel RaspaPremium" },
      { name: "description", content: "Gestão completa de usuários da plataforma." },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const fetchUsers = useServerFn(getAdminUsers);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () => fetchUsers({ data: { page, search } })
  });

  return (
    <AdminShell 
      title="Gestão de Usuários" 
      description="Visualize e gerencie todos os perfis cadastrados."
    >
      <div className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline">Exportar CSV</Button>
        </div>

        {/* Users Table */}
        <div className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Saldo Atual</TableHead>
                <TableHead>Estatísticas</TableHead>
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
              ) : data?.users && data.users.length > 0 ? (
                data.users.map((user: any) => (
                  <TableRow key={user.id} className="group">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold">{user.full_name || "Sem nome"}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="size-3" /> {user.email}
                        </span>
                        {user.phone && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Phone className="size-3" /> {user.phone}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={
                          user.status === 'ACTIVE' ? 'border-green-500/50 text-green-500' :
                          user.status === 'BLOCKED' ? 'border-red-500/50 text-red-500' :
                          'text-muted-foreground'
                        }
                      >
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" /> {formatDate(user.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Wallet className="size-3 text-primary" />
                        <span className="font-black text-sm">
                          {formatCurrency(user.wallets?.[0]?.balance ?? 0)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div title="Total Depositado" className="flex items-center gap-1 text-[10px] text-purple-500 font-bold">
                          <TrendingUp className="size-3" /> DEP
                        </div>
                        <div title="Total Gasto" className="flex items-center gap-1 text-[10px] text-blue-500 font-bold">
                          <ShoppingBag className="size-3" /> GASTO
                        </div>
                        <div title="Total Ganho" className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
                          <Trophy className="size-3" /> GANHO
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm">Editar</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <ShieldAlert className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum usuário encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {data?.users?.length || 0} de {data?.count || 0} usuários
          </p>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Anterior
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={(data?.count || 0) <= page * 20}
              onClick={() => setPage(p => p + 1)}
            >
              Próximo
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}