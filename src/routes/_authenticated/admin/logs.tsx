import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleUnderConstruction } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/logs")({
  head: () => ({
    meta: [
      { title: "Logs — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Logs da plataforma." },
    ],
  }),
  component: AdminModulePage,
});

function AdminModulePage() {
  return (
    <AdminShell title="Logs" description="Estrutura pronta para a próxima etapa do projeto.">
      <ModuleUnderConstruction module="Logs" />
    </AdminShell>
  );
}
