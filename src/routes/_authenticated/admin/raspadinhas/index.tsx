import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Ticket } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { adminScratchCardsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/raspadinhas/")({
  head: () => ({
    meta: [
      { title: "Gestão de raspadinhas — RaspaPremium" },
      { name: "description", content: "Cadastre, edite e acompanhe as raspadinhas da plataforma." },
    ],
  }),
  component: AdminScratchCardsPage,
});

function AdminScratchCardsPage() {
  const { data: cards, isLoading } = useQuery(adminScratchCardsQuery);

  return (
    <AdminShell
      title="Raspadinhas"
      description="Todas as raspadinhas cadastradas, independente do status."
      actions={
        <Button asChild className="bg-gradient-brand text-primary-foreground">
          <Link to="/admin/raspadinhas/novo">Nova raspadinha</Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="surface-card h-64 animate-pulse" />
      ) : cards && cards.length > 0 ? (
        <div className="surface-card overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Destaque</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead className="text-right">Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cards.map((card) => (
                <TableRow key={card.id}>
                  <TableCell className="font-medium">{card.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {card.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{card.is_free ? "Grátis" : formatCurrency(card.price)}</TableCell>
                  <TableCell>{card.is_featured ? "Sim" : "Não"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(card.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/raspadinha/$slug" params={{ slug: card.slug }}>
                        Ver
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyState
          icon={<Ticket className="size-6" />}
          title="Nenhuma raspadinha cadastrada"
          description="Crie a primeira raspadinha para começar a montar o catálogo."
          action={
            <Button asChild className="mt-2 bg-gradient-brand text-primary-foreground">
              <Link to="/admin/raspadinhas/novo">Criar raspadinha</Link>
            </Button>
          }
        />
      )}
    </AdminShell>
  );
}
