import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Plus, MoreVertical, Edit, Trash2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminBannersQuery } from "@/lib/queries";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/banners")({
  head: () => ({
    meta: [
      { title: "Banners — Painel RaspaPremium" },
      { name: "description", content: "Gestão de banners da plataforma." },
    ],
  }),
  component: AdminBannersPage,
});

function AdminBannersPage() {
  const { data: banners, isLoading } = useQuery(adminBannersQuery);

  return (
    <AdminShell 
      title="Gestão de Banners" 
      description="Controle os banners em destaque na página inicial."
      actions={
        <Button className="bg-gradient-brand text-primary-foreground">
          <Plus className="size-4 mr-2" /> Novo Banner
        </Button>
      }
    >
      <div className="surface-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Banner</TableHead>
              <TableHead>Posição / Ordem</TableHead>
              <TableHead>Duração</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5} className="h-20 animate-pulse bg-muted/20" />
                </TableRow>
              ))
            ) : banners && banners.length > 0 ? (
              banners.map((banner) => (
                <TableRow key={banner.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-4">
                      {banner.image_url ? (
                        <img 
                          src={banner.image_url} 
                          alt={banner.title} 
                          className="w-20 h-12 object-cover rounded-lg bg-muted border border-border"
                        />
                      ) : (
                        <div className="w-20 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="size-5" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{banner.title}</span>
                        <span className="text-[10px] text-muted-foreground">{banner.subtitle || "Sem subtítulo"}</span>
                        {banner.link_url && (
                          <a href={banner.link_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary flex items-center gap-1 hover:underline mt-0.5">
                            <ExternalLink className="size-2" /> {banner.link_url}
                          </a>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <Badge variant="secondary" className="w-fit text-[10px]">{banner.position}</Badge>
                      <span className="text-[10px] text-muted-foreground mt-1">Ordem: {banner.sort_order}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[10px] text-muted-foreground">
                      <span>De: {banner.starts_at ? formatDate(banner.starts_at) : "Imediato"}</span>
                      <span>Até: {banner.ends_at ? formatDate(banner.ends_at) : "Indeterminado"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {banner.is_active ? (
                      <Badge variant="outline" className="border-green-500/50 text-green-500 bg-green-500/5 gap-1">
                        <CheckCircle2 className="size-3" /> ATIVO
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/5 gap-1">
                        <XCircle className="size-3" /> INATIVO
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8">
                        <Edit className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 text-destructive">
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                  Nenhum banner cadastrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </AdminShell>
  );
}