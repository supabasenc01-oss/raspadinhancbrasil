import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleUnderConstruction } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/premios")({
  head: () => ({
    meta: [
      { title: "Prêmios — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Prêmios da plataforma." },
    ],
  }),
  component: AdminModulePage,
});

function AdminModulePage() {
  return (
    <AdminShell title="Prêmios" description="Estrutura pronta para a próxima etapa do projeto.">
      <ModuleUnderConstruction module="Prêmios" />
    </AdminShell>
  );
}
