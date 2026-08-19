import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  Settings as SettingsIcon, 
  Save, 
  Globe, 
  Layout, 
  Shield, 
  Image as ImageIcon,
  Link as LinkIcon,
  Search,
  Code,
  Upload,
  Loader2
} from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { systemSettingsQuery } from "@/lib/queries";
import { updateSystemSettings } from "@/lib/settings.functions";
import { useServerFn } from "@tanstack/react-start";
import { uploadPlatformFile } from "@/lib/storage";
import { uploadPlatformFileFn } from "@/lib/storage.functions";
import { ensureStorageBuckets } from "@/lib/storage-init.functions";
import { useFileUrl } from "@/hooks/useFileUrl";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Painel Administrativo" },
      { name: "description", content: "Gerencie as configurações globais da plataforma." },
    ],
  }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery(systemSettingsQuery);
  const updateSettingsFn = useServerFn(updateSystemSettings);
  
  const [values, setValues] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      const initialValues: Record<string, string> = {};
      settings.forEach((s: any) => {
        // Handle JSONB value from database
        let val = s.value;
        if (typeof val !== 'string') {
          val = JSON.stringify(val);
        }
        // Remove quotes if it's a simple string stored in JSONB
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        initialValues[s.key] = val;
      });
      setValues(initialValues);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: { key: string; value: string }[]) => updateSettingsFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Stringify simple values for JSONB storage
    const data = Object.entries(values).map(([key, value]) => ({ 
      key, 
      value: JSON.stringify(value) 
    }));
    mutation.mutate(data);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(key);
    try {
      // Convert file to base64 to send to server function
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result;
          if (typeof result === 'string') {
            const base64 = result.split(',')[1];
            resolve(base64 || "");
          } else {
            reject(new Error("Falha ao ler o arquivo"));
          }
        };
        reader.onerror = () => reject(new Error("Erro na leitura do arquivo"));
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      
      const result = await uploadPlatformFileFn({
        data: {
          bucket: "logos",
          fileName: file.name,
          fileType: file.type,
          base64Data,
          prefix: ""
        }
      });

      if (result.error) throw new Error(result.error);
      
      if (result.path) {
        handleChange(key, result.path);
        toast.success("Upload realizado com sucesso!");
      }
    } catch (error: any) {
      toast.error("Erro no upload: " + error.message);
    } finally {
      setIsUploading(null);
    }
  };

  const handleFixBuckets = async () => {
    try {
      const result = await ensureStorageBuckets();
      if (result.success) {
        toast.success("Pastas de armazenamento verificadas/criadas!");
      } else {
        toast.error("Erro ao criar pastas: " + result.error);
      }
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  if (isLoading) return <AdminShell title="Configurações"><div className="animate-pulse space-y-4"><div className="h-8 bg-surface w-1/4 rounded"></div><div className="h-64 bg-surface w-full rounded"></div></div></AdminShell>;

  return (
    <AdminShell 
      title="Configurações" 
      description="Gerencie a identidade, SEO e integrações da sua plataforma."
      actions={
        <Button onClick={handleSave} disabled={mutation.isPending} className="bg-gradient-brand">
          <Save className="mr-2 size-4" />
          {mutation.isPending ? "Salvando..." : "Salvar Alterações"}
        </Button>
      }
    >
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-surface border border-border/50 p-1">
          <TabsTrigger value="general" className="gap-2"><Layout className="size-4" /> Geral</TabsTrigger>
          <TabsTrigger value="seo" className="gap-2"><Search className="size-4" /> SEO & Meta</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2"><Code className="size-4" /> Integrações</TabsTrigger>
          <TabsTrigger value="links" className="gap-2"><LinkIcon className="size-4" /> Links Rodapé</TabsTrigger>
          <TabsTrigger value="layout" className="gap-2"><Layout className="size-4" /> Layout Home</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-surface border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Informações Básicas</CardTitle>
                <CardDescription>Nome e identidade visual da plataforma.</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleFixBuckets}
                className="text-xs"
              >
                Corrigir Erro de Pastas
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="site_name">Título do Site</Label>
                <Input 
                  id="site_name" 
                  value={values["site_name"] || ""} 
                  onChange={(e) => handleChange("site_name", e.target.value)}
                  placeholder="Ex: RaspaPremium"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <Label>Logotipo do Site</Label>
                  <div className="flex flex-col gap-4">
                    <div className="aspect-video w-full rounded-2xl bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                      {values["logo_url"] ? (
                        <LogoPreview url={values["logo_url"]} onRemove={() => handleChange("logo_url", "")} />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="size-8" />
                          <span className="text-xs">Nenhum logo carregado</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="logo_url" className="text-xs">URL Direta do Logo</Label>
                        <Input 
                          id="logo_url" 
                          value={values["logo_url"] || ""} 
                          onChange={(e) => handleChange("logo_url", e.target.value)}
                          placeholder="https://exemplo.com/logo.png"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="size-10 relative"
                          disabled={isUploading === 'logo_url'}
                        >
                          {isUploading === 'logo_url' ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Upload className="size-4" />
                          )}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'logo_url')}
                            disabled={isUploading === 'logo_url'}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Favicon do Site</Label>
                  <div className="flex flex-col gap-4">
                    <div className="size-20 rounded-2xl bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center p-2 relative overflow-hidden group mx-auto sm:mx-0">
                      {values["favicon_url"] ? (
                        <FaviconPreview url={values["favicon_url"]} onRemove={() => handleChange("favicon_url", "")} />
                      ) : (
                        <ImageIcon className="size-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="favicon_url" className="text-xs">URL do Favicon</Label>
                        <Input 
                          id="favicon_url" 
                          value={values["favicon_url"] || ""} 
                          onChange={(e) => handleChange("favicon_url", e.target.value)}
                          placeholder="https://exemplo.com/favicon.ico"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="size-10 relative"
                          disabled={isUploading === 'favicon_url'}
                        >
                          {isUploading === 'favicon_url' ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Upload className="size-4" />
                          )}
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            accept="image/*"
                            onChange={(e) => handleFileUpload(e, 'favicon_url')}
                            disabled={isUploading === 'favicon_url'}
                          />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Meta Tags & SEO</CardTitle>
              <CardDescription>Otimização para motores de busca e redes sociais.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="meta_description">Descrição Meta (SEO)</Label>
                <Textarea 
                  id="meta_description" 
                  value={values["meta_description"] || ""} 
                  onChange={(e) => handleChange("meta_description", e.target.value)}
                  placeholder="Descrição da plataforma para o Google..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="og_image_url">Imagem Social (Facebook/WhatsApp)</Label>
                <Input 
                  id="og_image_url" 
                  value={values["og_image_url"] || ""} 
                  onChange={(e) => handleChange("og_image_url", e.target.value)}
                  placeholder="URL da imagem para compartilhamento"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="friendly_urls">URLs Amigáveis</Label>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="friendly_urls" 
                    checked={values["friendly_urls"] === "true"} 
                    onChange={(e) => handleChange("friendly_urls", e.target.checked.toString())}
                    className="size-4 accent-primary"
                  />
                  <Label htmlFor="friendly_urls" className="text-sm font-normal">Ativar URLs amigáveis para raspadinhas</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Scripts Externos</CardTitle>
              <CardDescription>Integrações com ferramentas de análise.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="google_analytics_id">Google Analytics ID</Label>
                <Input 
                  id="google_analytics_id" 
                  value={values["google_analytics_id"] || ""} 
                  onChange={(e) => handleChange("google_analytics_id", e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                <Input 
                  id="facebook_pixel_id" 
                  value={values["facebook_pixel_id"] || ""} 
                  onChange={(e) => handleChange("facebook_pixel_id", e.target.value)}
                  placeholder="1234567890"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="links">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Customização do Rodapé</CardTitle>
              <CardDescription>Links externos e créditos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="footer_external_link">Link Sistema de Raspadinha (NC Brasil)</Label>
                <Input 
                  id="footer_external_link" 
                  value={values["footer_external_link"] || "https://www.ncbrasil.com.br"} 
                  onChange={(e) => handleChange("footer_external_link", e.target.value)}
                  placeholder="https://www.ncbrasil.com.br"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Layout da Página Inicial</CardTitle>
              <CardDescription>Habilite ou desabilite seções da Home.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: "show_hero_banners", label: "Banners Rotativos (Hero)" },
                { key: "show_winners_ticker", label: "Barra de Ganhadores Ao Vivo" },
                { key: "show_scratch_demo", label: "Área de Demonstração Interativa" },
                { key: "show_scratch_cards", label: "Grade de Raspadinhas" },
                { key: "show_how_to_play", label: "Seção 'Como Jogar'" },
                { key: "show_latest_winners", label: "Bloco de Últimos Ganhadores" },
                { key: "show_testimonials", label: "Seção de Depoimentos" },
                { key: "show_app_download", label: "Banner de Download do App" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="space-y-0.5">
                    <Label htmlFor={item.key} className="text-base">{item.label}</Label>
                  </div>
                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={item.key} 
                      checked={values[item.key] === "true"} 
                      onChange={(e) => handleChange(item.key, e.target.checked.toString())}
                      className="size-5 accent-primary cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}

function LogoPreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  const fileUrl = useFileUrl(url);

  return (
    <>
      {fileUrl && <img src={fileUrl} className="max-h-full max-w-full object-contain z-10" alt="Logo preview" />}
      <button 
        onClick={onRemove}
        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 text-white font-bold"
      >
        Substituir Logotipo
      </button>
    </>
  );
}

function FaviconPreview({ url, onRemove }: { url: string; onRemove: () => void }) {
  const fileUrl = useFileUrl(url);
  
  return (
    <>
      {fileUrl && <img src={fileUrl} className="size-10 object-contain z-10" alt="Favicon preview" />}
      <button 
        onClick={onRemove}
        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 text-white text-[10px] font-bold"
      >
        Substituir
      </button>
    </>
  );
}
