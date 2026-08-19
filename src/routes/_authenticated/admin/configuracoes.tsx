import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleUnderConstruction } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Configurações da plataforma." },
    ],
  }),
  component: AdminModulePage,
});

function AdminModulePage() {
  return (
    <AdminShell title="Configurações" description="Estrutura pronta para a próxima etapa do projeto.">
      <ModuleUnderConstruction module="Configurações" />
    </AdminShell>
  );
}
