import { createFileRoute } from "@tanstack/react-router";

import { AdminShell } from "@/components/admin/AdminShell";
import { ModuleUnderConstruction } from "@/components/EmptyState";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({
    meta: [
      { title: "Banners — Painel RaspaPremium" },
      { name: "description", content: "Módulo administrativo de Banners da plataforma." },
    ],
  }),
  component: AdminModulePage,
});

function AdminModulePage() {
  return (
    <AdminShell title="Banners" description="Estrutura pronta para a próxima etapa do projeto.">
      <ModuleUnderConstruction module="Banners" />
    </AdminShell>
  );
}
