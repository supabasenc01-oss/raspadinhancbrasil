import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Image as ImageIcon, Plus, Edit, Trash2, CheckCircle2, XCircle, ExternalLink, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { upsertBanner, deleteBanner } from "@/lib/admin.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadPlatformFile } from "@/lib/storage";

const bannerSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Título é obrigatório"),
  subtitle: z.string().optional(),
  image_url: z.string().min(1, "Imagem é obrigatória"),
  link_url: z.string().optional(),
  position: z.string(),
  sort_order: z.number(),
  is_active: z.boolean(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;


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
  const queryClient = useQueryClient();
  const { data: banners, isLoading } = useQuery(adminBannersQuery);
  const upsertBannerFn = useServerFn(upsertBanner);
  const deleteBannerFn = useServerFn(deleteBanner);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerFormValues | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      position: "HOME_HERO",
      sort_order: 0,
      is_active: true,
      starts_at: "",
      ends_at: "",
    },
  });

  const upsertMutation = useMutation({
    mutationFn: (data: BannerFormValues) => upsertBannerFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "home-hero"] });
      toast.success(editingBanner?.id ? "Banner atualizado!" : "Banner criado!");
      setIsDialogOpen(false);
      form.reset();
      setEditingBanner(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar banner: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBannerFn({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      queryClient.invalidateQueries({ queryKey: ["banners", "home-hero"] });
      toast.success("Banner excluído!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir banner: " + error.message);
    },
  });

  const handleEdit = (banner: any) => {
    const values = {
      id: banner.id,
      title: banner.title,
      subtitle: banner.subtitle || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      position: banner.position,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
      starts_at: banner.starts_at ? new Date(banner.starts_at).toISOString().slice(0, 16) : "",
      ends_at: banner.ends_at ? new Date(banner.ends_at).toISOString().slice(0, 16) : "",
    };
    setEditingBanner(values);
    form.reset(values);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingBanner(null);
    form.reset({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      position: "HOME_HERO",
      sort_order: 0,
      is_active: true,
      starts_at: "",
      ends_at: "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este banner?")) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: BannerFormValues) => {
    upsertMutation.mutate(data);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Image validation: Type and Size
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado. Use PNG, JPG, SVG ou WebP.");
      return;
    }

    if (file.size > maxSize) {
      toast.error("O arquivo é muito grande. O tamanho máximo permitido é 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const { path, error } = await uploadPlatformFile("banners", file);
      if (error) throw new Error(error);
      if (path) {
        form.setValue("image_url", path);
        toast.success("Upload realizado!");
      }
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminShell 
      title="Gestão de Banners" 
      description="Controle os banners em destaque na página inicial."
      actions={
        <Button onClick={handleAddNew} className="bg-gradient-brand text-primary-foreground">
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
                          src={banner.image_url.startsWith('banners/') ? `${import.meta.env['VITE_SUPABASE_URL']}/storage/v1/object/public/${banner.image_url}` : banner.image_url} 
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
                      <Button variant="ghost" size="icon" className="size-8" onClick={() => handleEdit(banner)}>
                        <Edit className="size-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 text-destructive" 
                        onClick={() => handleDelete(banner.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl bg-surface border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? "Editar Banner" : "Novo Banner"}</DialogTitle>
            <DialogDescription>
              Preencha as informações do banner que será exibido na página inicial.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mega PIX Instantâneo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtítulo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: O prêmio cai na sua conta em segundos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="image_url"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Imagem do Banner</FormLabel>
                      <div className="flex flex-col gap-4">
                        <div className="aspect-[21/9] w-full rounded-2xl bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                          {field.value ? (
                            <>
                              <img 
                                src={field.value.startsWith('banners/') ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${field.value}` : field.value} 
                                className="absolute inset-0 w-full h-full object-cover" 
                                alt="Preview" 
                              />
                              <Button 
                                type="button" 
                                variant="destructive" 
                                size="icon" 
                                className="absolute top-2 right-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => field.onChange("")}
                              >
                                <X className="size-4" />
                              </Button>
                            </>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <ImageIcon className="size-8" />
                              <span className="text-xs">Nenhuma imagem carregada</span>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <FormControl className="flex-1">
                            <Input placeholder="URL da imagem ou faça upload" {...field} />
                          </FormControl>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon" 
                            className="size-10 relative"
                            disabled={isUploading}
                          >
                            {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                            <input 
                              type="file" 
                              className="absolute inset-0 opacity-0 cursor-pointer" 
                              accept="image/*"
                              onChange={handleFileUpload}
                              disabled={isUploading}
                            />
                          </Button>
                        </div>
                      </div>
                      <FormDescription>Recomendado: 1200x500px. Máximo 2MB.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="link_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL de Destino (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: /raspadinhas" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posição</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a posição" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-surface border-border">
                          <SelectItem value="HOME_HERO">Home Hero (Carrossel)</SelectItem>
                          <SelectItem value="SIDEBAR">Lateral</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="sort_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="starts_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ends_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Status Ativo</FormLabel>
                      <FormDescription>
                        Define se o banner está visível para os usuários.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-gradient-brand" disabled={upsertMutation.isPending}>
                  {upsertMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {editingBanner ? "Salvar Alterações" : "Criar Banner"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
