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
  Code
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

  useEffect(() => {
    if (settings) {
      const initialValues: Record<string, string> = {};
      settings.forEach((s: any) => {
        initialValues[s.key] = s.value;
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
    const data = Object.entries(values).map(([key, value]) => ({ key, value }));
    mutation.mutate(data);
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
        </TabsList>

        <TabsContent value="general">
          <Card className="bg-surface border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
              <CardDescription>Nome e identidade visual da plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="site_name">Título do Site</Label>
                <Input 
                  id="site_name" 
                  value={values.site_name || ""} 
                  onChange={(e) => handleChange("site_name", e.target.value)}
                  placeholder="Ex: RaspaPremium"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo_url">URL do Logotipo</Label>
                <div className="flex gap-2">
                  <Input 
                    id="logo_url" 
                    value={values.logo_url || ""} 
                    onChange={(e) => handleChange("logo_url", e.target.value)}
                    placeholder="https://exemplo.com/logo.png"
                  />
                  {values.logo_url && (
                    <div className="size-10 rounded border border-border bg-white p-1 shrink-0">
                      <img src={values.logo_url} className="w-full h-full object-contain" alt="Preview" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="favicon_url">URL do Favicon</Label>
                <Input 
                  id="favicon_url" 
                  value={values.favicon_url || ""} 
                  onChange={(e) => handleChange("favicon_url", e.target.value)}
                  placeholder="https://exemplo.com/favicon.ico"
                />
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
                  value={values.meta_description || ""} 
                  onChange={(e) => handleChange("meta_description", e.target.value)}
                  placeholder="Descrição da plataforma para o Google..."
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="og_image_url">Imagem Social (Facebook/WhatsApp)</Label>
                <Input 
                  id="og_image_url" 
                  value={values.og_image_url || ""} 
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
                    checked={values.friendly_urls === "true"} 
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
                  value={values.google_analytics_id || ""} 
                  onChange={(e) => handleChange("google_analytics_id", e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="facebook_pixel_id">Facebook Pixel ID</Label>
                <Input 
                  id="facebook_pixel_id" 
                  value={values.facebook_pixel_id || ""} 
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
                  value={values.footer_external_link || "https://www.ncbrasil.com.br"} 
                  onChange={(e) => handleChange("footer_external_link", e.target.value)}
                  placeholder="https://www.ncbrasil.com.br"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminShell>
  );
}
