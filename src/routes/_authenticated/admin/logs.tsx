import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Search, User, Activity, Clock, Database, ArrowRightLeft } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { adminLogsQuery } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({
    meta: [
      { title: "Logs — Painel RaspaPremium" },
      { name: "description", content: "Auditoria e logs do sistema." },
    ],
  }),
  component: AdminLogsPage,
});

function AdminLogsPage() {
  const [search, setSearch] = useState("");
  const { data: logs, isLoading } = useQuery(adminLogsQuery);

  return (
    <AdminShell 
      title="Auditoria de Sistema" 
      description="Histórico completo de ações administrativas e alterações críticas."
    >
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="Filtrar por ação ou administrador..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="surface-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nível</TableHead>
                <TableHead>Ação / Entidade</TableHead>
                <TableHead>Administrador</TableHead>
                <TableHead>Detalhes / Erro</TableHead>
                <TableHead>Data / IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4} className="h-12 animate-pulse bg-muted/20" />
                  </TableRow>
                ))
              ) : logs && logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log.id} className="text-sm">
                    <TableCell>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        (log as any).severity === 'ERROR' || (log as any).severity === 'CRITICAL' 
                          ? 'bg-red-500/20 text-red-500' 
                          : (log as any).severity === 'WARNING'
                          ? 'bg-yellow-500/20 text-yellow-500'
                          : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {(log as any).severity || 'INFO'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-surface border border-border flex items-center justify-center text-primary">
                          <Activity className="size-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold uppercase text-[10px] tracking-widest">{log.action}</span>
                          <span className="text-[10px] text-muted-foreground">{log.entity || "SISTEMA"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="size-3 text-muted-foreground" />
                        <span className="text-xs font-medium">{log.actor_id || "Sistema Automático"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 max-w-xs">
                        {log.old_data || log.new_data ? (
                          <div className="flex flex-col gap-1 text-[10px]">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="p-1 rounded bg-muted shrink-0">DE</span>
                              <span className="truncate italic">{JSON.stringify(log.old_data) || "nulo"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary">
                              <span className="p-1 rounded bg-primary/10 shrink-0">PARA</span>
                              <span className="truncate font-bold">{JSON.stringify(log.new_data) || "nulo"}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-[10px]">Sem detalhes</span>
                        )}
                        {(log as any).stack_trace && (
                          <div className="mt-2 p-2 bg-red-950/30 border border-red-500/20 rounded text-[9px] font-mono text-red-200 overflow-x-auto max-h-24">
                            {(log as any).stack_trace}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-foreground whitespace-nowrap">
                          <Clock className="size-3" /> {formatDate(log.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="size-3" /> {log.ip_address || "0.0.0.0"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    Nenhum log encontrado.
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