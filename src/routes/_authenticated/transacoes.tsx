import { createFileRoute } from '@tanstack/react-router'
import { PublicPage } from '@/components/layout/PublicPage'

export const Route = createFileRoute('/_authenticated/transacoes')({
  component: () => (
    <PublicPage>
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-6">Histórico de Transações</h1>
        <p className="text-muted-foreground">Esta funcionalidade está sendo movida para a nova área de carteira.</p>
      </div>
    </PublicPage>
  )
})
