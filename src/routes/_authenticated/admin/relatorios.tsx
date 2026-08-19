import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleUnderConstruction } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/relatorios")({
  head: () => ({
    meta: [
      { title: "Relatórios — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Relatórios da plataforma." },
    ],
  }),
  component: AdminModulePage,
});

function AdminModulePage() {
  return (
    <AdminShell title="Relatórios" description="Estrutura pronta para a próxima etapa do projeto.">
      <ModuleUnderConstruction module="Relatórios" />
    </AdminShell>
  );
}
