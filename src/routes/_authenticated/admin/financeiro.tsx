import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleUnderConstruction } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Financeiro da plataforma." },
    ],
  }),
  component: AdminModulePage,
});

function AdminModulePage() {
  return (
    <AdminShell title="Financeiro" description="Estrutura pronta para a próxima etapa do projeto.">
      <ModuleUnderConstruction module="Financeiro" />
    </AdminShell>
  );
}
