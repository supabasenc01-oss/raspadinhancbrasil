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
  Loader2,
  Sparkles,
  Palette,
  KeyRound,
  Store as StoreIcon,
  Plus,
  Trash2,
  Receipt
} from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { ColorInput } from "@/components/admin/ColorInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { systemSettingsQuery } from "@/lib/queries";
import { callEdgeFunction } from "@/lib/edge-functions";
import { uploadPlatformFile } from "@/lib/storage";
import { useFileUrl } from "@/hooks/useFileUrl";
import { supabase } from "@/integrations/supabase/client";
import { storesQuery } from "@/lib/stores";

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

  const [values, setValues] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ password: "", confirmPassword: "" });

  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const initialValues: Record<string, string> = {};
      settings.forEach((s: any) => {
        if (!s || !s.key) return;
        
        let val = s.value;
        if (val === null || val === undefined) {
          val = "";
        } else if (typeof val !== 'string') {
          val = JSON.stringify(val);
        }
        
        // Remove quotes if it's a simple string stored in JSONB
        if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
          try {
            const parsed = JSON.parse(val);
            if (typeof parsed === 'string') val = parsed;
          } catch (e) {
            val = val.slice(1, -1);
          }
        }
        initialValues[s.key] = val;
      });
      setValues(initialValues);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: (data: { key: string; value: string }[]) => callEdgeFunction('update-system-settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["file-url"] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    }
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const password = passwordForm.password.trim();
      const confirmPassword = passwordForm.confirmPassword.trim();

      if (password.length < 8) {
        throw new Error("A nova senha deve ter pelo menos 8 caracteres.");
      }

      if (password !== confirmPassword) {
        throw new Error("As senhas digitadas não conferem.");
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
    },
    onSuccess: () => {
      setPasswordForm({ password: "", confirmPassword: "" });
      toast.success("Senha administrativa atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Não foi possível atualizar a senha.");
    },
  });

  const receiptsConfig = (() => {
    try {
      const parsed = JSON.parse(values["receipts"] || "{}");
      return typeof parsed === "object" && parsed && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {} as Record<string, unknown>;
    }
  })() as Record<string, any>;

  const updateReceiptsConfig = (key: string, value: unknown) => {
    const next = { ...receiptsConfig, [key]: value };
    setValues((prev) => ({ ...prev, receipts: JSON.stringify(next) }));
  };

  const handleChange = (key: string, value: string) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    // Stringify simple values for JSONB storage
    const data = Object.entries(values).map(([key, value]) => {
      const trimmed = (value ?? "").trim();
      // Configurações que já são JSON (objetos/arrays) são salvas sem re-encapsular em string.
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          JSON.parse(trimmed);
          return { key, value: trimmed };
        } catch {
          // valor inválido, salva como texto
        }
      }
      return { key, value: JSON.stringify(value) };
    });
    mutation.mutate(data);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Image validation: Type and Size
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/x-icon'];
    const maxSize = 2 * 1024 * 1024; // 2MB

    if (!allowedTypes.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado. Use PNG, JPG, SVG ou WebP.");
      return;
    }

    if (file.size > maxSize) {
      toast.error("O arquivo é muito grande. O tamanho máximo permitido é 2MB.");
      return;
    }

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
      
      const result = await callEdgeFunction<{ path: string | null; thumbnailPath?: string | null; error: string | null }>(
        'upload-platform-file',
        {
          bucket: "logos",
          fileName: file.name,
          fileType: file.type,
          base64Data,
          prefix: ""
        }
      );

      if (!result) throw new Error("O servidor não retornou resposta");
      if (result.error) throw new Error(result.error);
      
      if (result.path) {
        handleChange(key, result.path);
        // If it's a logo or banner, we might want to store the thumbnail too
        // For simple settings we store the main path, but useFileUrl can be updated to prefer thumbnail
        if (result.thumbnailPath) {
          // Check if there's a corresponding thumbnail key
          const thumbKey = key.replace('_url', '_thumbnail_url');
          handleChange(thumbKey, result.thumbnailPath);
        }
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
      const result = await callEdgeFunction<{ success: boolean; error?: string }>('ensure-storage-buckets');
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
          <TabsTrigger value="mercadopago" className="gap-2"><Globe className="size-4" /> Mercado Pago</TabsTrigger>
          <TabsTrigger value="links" className="gap-2"><LinkIcon className="size-4" /> Links Rodapé</TabsTrigger>
          <TabsTrigger value="layout" className="gap-2"><Layout className="size-4" /> Layout Home</TabsTrigger>
          <TabsTrigger value="scratch" className="gap-2"><Sparkles className="size-4" /> Raspagem</TabsTrigger>
          <TabsTrigger value="colors" className="gap-2"><Palette className="size-4" /> Cores & Identidade</TabsTrigger>
          <TabsTrigger value="stores" className="gap-2"><StoreIcon className="size-4" /> Filiais & Cupons</TabsTrigger>
          <TabsTrigger value="account" className="gap-2"><KeyRound className="size-4" /> Conta</TabsTrigger>
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

        <TabsContent value="mercadopago">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Configurações do Mercado Pago</CardTitle>
              <CardDescription>Configure suas credenciais para aceitar pagamentos via PIX e Cartão.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="mercadopago_public_key">Public Key (Chave Pública)</Label>
                <Input 
                  id="mercadopago_public_key" 
                  value={values["mercadopago_public_key"] || ""} 
                  onChange={(e) => handleChange("mercadopago_public_key", e.target.value)}
                  placeholder="APP_USR-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mercadopago_access_token">Access Token (Token de Acesso)</Label>
                <Input 
                  id="mercadopago_access_token" 
                  type="password"
                  value={values["mercadopago_access_token"] || ""} 
                  onChange={(e) => handleChange("mercadopago_access_token", e.target.value)}
                  placeholder="APP_USR-XXXXXXXXXXXXXXXX-XXXXXX-XXXXXXXXXXXXXXXXXXXXXXXX-XXXXXXXX"
                />
                <p className="text-[10px] text-muted-foreground">
                  Nota: O Access Token é sensível e será armazenado de forma segura no banco de dados.
                </p>
              </div>
              
              <div className="pt-4 border-t border-border/30">
                <h4 className="text-sm font-semibold mb-2">Webhook URL</h4>
                <div className="bg-black/20 p-3 rounded-lg flex items-center justify-between border border-white/5">
                  <code className="text-xs text-primary">{typeof window !== 'undefined' ? window.location.origin : ''}/api/public/mercadopago-webhook</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/api/public/mercadopago-webhook`);
                      toast.success("URL copiada!");
                    }}
                  >
                    <LinkIcon className="size-3 mr-2" /> Copiar
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Configure esta URL no painel do Mercado Pago para receber notificações de pagamento.
                </p>
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

        <TabsContent value="colors">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Cores do Sistema (Gradientes)</CardTitle>
              <CardDescription>Configure as cores dos gradientes Azul e Laranja para as raspadinhas e botões.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-primary">Gradiente Primário (Azul)</h4>
                  <ColorInput 
                    id="brand_start_color" 
                    label="Cor Inicial (Gradiente Azul)"
                    value={values["brand_start_color"] || "#3B82F6"} 
                    onChange={(val) => handleChange("brand_start_color", val)}
                  />
                  <ColorInput 
                    id="brand_end_color" 
                    label="Cor Final (Gradiente Azul)"
                    value={values["brand_end_color"] || "#1E3A8A"} 
                    onChange={(val) => handleChange("brand_end_color", val)}
                  />
                  <div className="h-10 w-full rounded-lg bg-gradient-brand border border-border" />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-accent">Gradiente de Destaque (Laranja)</h4>
                  <ColorInput 
                    id="accent_start_color" 
                    label="Cor Inicial (Gradiente Laranja)"
                    value={values["accent_start_color"] || "#F97316"} 
                    onChange={(val) => handleChange("accent_start_color", val)}
                  />
                  <ColorInput 
                    id="accent_end_color" 
                    label="Cor Final (Gradiente Laranja)"
                    value={values["accent_end_color"] || "#EA580C"} 
                    onChange={(val) => handleChange("accent_end_color", val)}
                  />
                  <div className="h-10 w-full rounded-lg bg-gradient-accent border border-border" />
                </div>
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
                { key: "show_app_download", label: "Faixa superior promocional (Créditos extras / App)" },
                { key: "show_floating_bubbles", label: "Balões de notificação de participação (canto da tela)" },
                { key: "show_demo_highlights", label: "Destaques da demonstração (Prêmios VIP / Pagamento Express)" },
                { key: "show_public_prizes", label: "Mostrar lista de prêmios disponíveis para o usuário" },
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

          <Card className="mt-6 bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Textos da Página Inicial</CardTitle>
              <CardDescription>Personalize a faixa promocional e os destaques da demonstração.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="app_banner_text">Texto da faixa superior</Label>
                <Input
                  id="app_banner_text"
                  value={values["app_banner_text"] || ""}
                  onChange={(e) => handleChange("app_banner_text", e.target.value)}
                  placeholder="Ex: Ganhe créditos extras enviando seu cupom fiscal!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_banner_cta">Texto do botão (vazio = sem botão)</Label>
                <Input
                  id="app_banner_cta"
                  value={values["app_banner_cta"] ?? ""}
                  onChange={(e) => handleChange("app_banner_cta", e.target.value)}
                  placeholder="Enviar cupom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="app_banner_link">Link do botão</Label>
                <Input
                  id="app_banner_link"
                  value={values["app_banner_link"] || ""}
                  onChange={(e) => handleChange("app_banner_link", e.target.value)}
                  placeholder="/cupons"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo_highlight_1_title">Destaque 1 — título</Label>
                <Input
                  id="demo_highlight_1_title"
                  value={values["demo_highlight_1_title"] || ""}
                  onChange={(e) => handleChange("demo_highlight_1_title", e.target.value)}
                  placeholder="Prêmios VIP"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo_highlight_1_subtitle">Destaque 1 — descrição</Label>
                <Input
                  id="demo_highlight_1_subtitle"
                  value={values["demo_highlight_1_subtitle"] || ""}
                  onChange={(e) => handleChange("demo_highlight_1_subtitle", e.target.value)}
                  placeholder="PIX e Itens Exclusivos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo_highlight_2_title">Destaque 2 — título</Label>
                <Input
                  id="demo_highlight_2_title"
                  value={values["demo_highlight_2_title"] || ""}
                  onChange={(e) => handleChange("demo_highlight_2_title", e.target.value)}
                  placeholder="Pagamento Express"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo_highlight_2_subtitle">Destaque 2 — descrição</Label>
                <Input
                  id="demo_highlight_2_subtitle"
                  value={values["demo_highlight_2_subtitle"] || ""}
                  onChange={(e) => handleChange("demo_highlight_2_subtitle", e.target.value)}
                  placeholder="Receba via PIX na hora"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="scratch">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Personalização da Raspadinha</CardTitle>
              <CardDescription>Configure o que o usuário vê antes de raspar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-4">
                  <Label>Logotipo de Cobertura</Label>
                  <div className="flex flex-col gap-4">
                    <div className="aspect-video w-full rounded-2xl bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center p-4 relative overflow-hidden group">
                      {values["scratch_overlay_logo_url"] ? (
                        <LogoPreview url={values["scratch_overlay_logo_url"]} onRemove={() => handleChange("scratch_overlay_logo_url", "")} />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                          <ImageIcon className="size-8" />
                          <span className="text-xs">Usa o logo principal por padrão</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input 
                        value={values["scratch_overlay_logo_url"] || ""} 
                        onChange={(e) => handleChange("scratch_overlay_logo_url", e.target.value)}
                        placeholder="URL do logo personalizado"
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="size-10 relative"
                        disabled={isUploading === 'scratch_overlay_logo_url'}
                      >
                        {isUploading === 'scratch_overlay_logo_url' ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4" />
                        )}
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'scratch_overlay_logo_url')}
                          disabled={isUploading === 'scratch_overlay_logo_url'}
                        />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <ColorInput 
                    id="scratch_overlay_bg_color" 
                    label="Cor de Fundo da Cobertura"
                    value={values["scratch_overlay_bg_color"] || "#0F172A"} 
                    onChange={(val) => handleChange("scratch_overlay_bg_color", val)}
                  />

                  <div className="grid gap-2">
                    <Label htmlFor="scratch_overlay_text">Texto de Orientação</Label>
                    <Input 
                      id="scratch_overlay_text" 
                      value={values["scratch_overlay_text"] || ""} 
                      onChange={(e) => handleChange("scratch_overlay_text", e.target.value)}
                      placeholder="Ex: Raspe aqui para ganhar!"
                    />
                    <p className="text-[10px] text-muted-foreground">Deixe em branco para não exibir texto.</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="scratch_threshold">Limiar de Revelação (%)</Label>
                    <div className="flex items-center gap-4">
                      <Input 
                        id="scratch_threshold" 
                        type="range"
                        min="10"
                        max="90"
                        step="5"
                        value={values["scratch_threshold"] || "45"} 
                        onChange={(e) => handleChange("scratch_threshold", e.target.value)}
                        className="flex-1 accent-primary"
                      />
                      <span className="w-12 text-sm font-bold text-primary">
                        {values["scratch_threshold"] || "45"}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Porcentagem da área que deve ser raspada para revelar o prêmio automaticamente.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stores">
          <StoresManager />

          <Card className="mt-6 bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="size-4" /> Regra de liberação por cupom fiscal
              </CardTitle>
              <CardDescription>
                Defina quantas raspadinhas o cliente libera por valor gasto. A liberação continua
                dependendo da aprovação manual do cupom pela filial.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="receipt_step">Valor da faixa (R$)</Label>
                <Input
                  id="receipt_step"
                  type="number"
                  min="1"
                  value={receiptsConfig["valuePerCredit"] ?? 100}
                  onChange={(e) => updateReceiptsConfig("valuePerCredit", Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt_per_step">Raspadinhas por faixa</Label>
                <Input
                  id="receipt_per_step"
                  type="number"
                  min="1"
                  value={receiptsConfig["creditsPerStep"] ?? 2}
                  onChange={(e) => updateReceiptsConfig("creditsPerStep", Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt_max">Limite por cupom</Label>
                <Input
                  id="receipt_max"
                  type="number"
                  min="1"
                  value={receiptsConfig["maxCreditsPerReceipt"] ?? 50}
                  onChange={(e) => updateReceiptsConfig("maxCreditsPerReceipt", Number(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2 sm:col-span-3">
                <Label htmlFor="receipt_instructions">Instruções exibidas ao cliente</Label>
                <Textarea
                  id="receipt_instructions"
                  value={receiptsConfig["instructions"] ?? ""}
                  onChange={(e) => updateReceiptsConfig("instructions", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Cada cupom fiscal só pode ser usado uma única vez, em qualquer filial — essa
                  validação é feita automaticamente pelo sistema.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Senha do Administrador</CardTitle>
              <CardDescription>Altere a senha da conta administrativa que está conectada agora.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="admin_new_password">Nova senha</Label>
                  <Input
                    id="admin_new_password"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.password}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="Mínimo de 8 caracteres"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="admin_confirm_password">Confirmar senha</Label>
                  <Input
                    id="admin_confirm_password"
                    type="password"
                    autoComplete="new-password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                    placeholder="Digite novamente"
                  />
                </div>
              </div>
              <Button
                type="button"
                onClick={() => passwordMutation.mutate()}
                disabled={passwordMutation.isPending}
                className="bg-gradient-brand"
              >
                {passwordMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <KeyRound className="mr-2 size-4" />}
                Atualizar senha
              </Button>
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
