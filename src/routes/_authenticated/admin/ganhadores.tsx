import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleUnderConstruction } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/ganhadores")({
  head: () => ({
    meta: [
      { title: "Ganhadores — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Ganhadores da plataforma." },
    ],
  }),
  component: AdminModulePage,
});

function AdminModulePage() {
  return (
    <AdminShell title="Ganhadores" description="Estrutura pronta para a próxima etapa do projeto.">
      <ModuleUnderConstruction module="Ganhadores" />
    </AdminShell>
  );
}
