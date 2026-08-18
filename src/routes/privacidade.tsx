import { createFileRoute } from "@tanstack/react-router";

import { PageHero, PublicPage } from "@/components/layout/PublicPage";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de privacidade — RaspaPremium" },
      {
        name: "description",
        content: "Como a RaspaPremium coleta, usa e protege os dados pessoais dos usuários.",
      },
      { property: "og:title", content: "Política de privacidade — RaspaPremium" },
      { property: "og:description", content: "Como tratamos e protegemos seus dados pessoais." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PublicPage>
      <PageHero
        eyebrow="Legal"
        title="Política de privacidade"
        description="Transparência total sobre os dados que tratamos."
      />
      <section className="mx-auto w-full max-w-3xl space-y-6 px-4 py-12 text-sm text-muted-foreground">
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground">Dados coletados</h2>
          <p className="mt-2">
            Nome, e-mail, telefone (opcional) e foto de perfil (opcional), além de registros técnicos
            necessários à segurança da conta.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground">Uso dos dados</h2>
          <p className="mt-2">
            Utilizamos seus dados para autenticação, suporte, prevenção a fraudes e comunicação
            sobre a sua conta.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground">Proteção e acesso</h2>
          <p className="mt-2">
            Cada usuário acessa apenas os seus próprios dados. O acesso administrativo é restrito a
            perfis autorizados e registrado em log de auditoria.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="font-display text-base font-semibold text-foreground">Seus direitos</h2>
          <p className="mt-2">
            Você pode solicitar acesso, correção ou exclusão dos seus dados pelos canais de suporte.
          </p>
        </div>
      </section>
    </PublicPage>
  );
}
