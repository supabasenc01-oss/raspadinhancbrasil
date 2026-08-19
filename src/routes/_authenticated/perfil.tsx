import { createFileRoute } from '@tanstack/react-router'
import { PublicPage } from '@/components/layout/PublicPage'

export const Route = createFileRoute('/_authenticated/perfil')({
  component: () => (
    <PublicPage>
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-2xl font-bold mb-6">Meu Perfil</h1>
        <p className="text-muted-foreground">Em desenvolvimento.</p>
      </div>
    </PublicPage>
  )
})
