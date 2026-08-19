import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleUnderConstruction } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Usuários da plataforma." },
    ],
  }),
  component: AdminModulePage,
});

function AdminModulePage() {
  return (
    <AdminShell title="Usuários" description="Estrutura pronta para a próxima etapa do projeto.">
      <ModuleUnderConstruction module="Usuários" />
    </AdminShell>
  );
}
