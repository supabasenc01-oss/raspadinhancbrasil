import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  ChevronRight, 
  Image as ImageIcon, 
  Info, 
  Plus, 
  Save, 
  Trash2, 
  Trophy 
} from "lucide-react";
import { toast } from "sonner";

import { AdminShell } from "@/components/layout/AdminShell";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";

const prizeSchema = z.object({
  title: z.string().min(2, "Título é obrigatório"),
  description: z.string().optional(),
  value: z.number().min(0),
  probability: z.number().min(0).max(1),
  quantity_total: z.number().min(1),
  is_active: z.boolean().default(true),
});

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
  price: z.number().min(0),
  is_free: z.boolean().default(false),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]).default("DRAFT"),
  featured: z.boolean().default(false),
  prizes: z.array(prizeSchema).min(1, "Adicione pelo menos um prêmio"),
});

type FormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute("/_authenticated/admin/raspadinhas/novo")({
  component: NewScratchCardWizard,
});

const STEPS = [
  "Informações",
  "Visual",
  "Preço",
  "Prêmios",
  "Revisão"
];

function NewScratchCardWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      is_free: false,
      status: "DRAFT",
      featured: false,
      prizes: [
        { title: "Prêmio 1", value: 10, probability: 0.1, quantity_total: 100, is_active: true }
      ],
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // 1. Validar probabilidades
      const totalProb = values.prizes.reduce((sum, p) => sum + p.probability, 0);
      if (totalProb > 1) {
        toast.error("A soma das probabilidades não pode ser maior que 100% (1.0)");
        setCurrentStep(3); // Go to prizes step
        return;
      }

      // 2. Inserir Scratch Card
      const { data: card, error: cardError } = await supabase
        .from("scratch_cards")
        .insert({
          name: values.name,
          slug: slugify(values.name),
          description: values.description,
          price: values.price,
          is_free: values.is_free,
          status: values.status,
          featured: values.featured,
        })
        .select()
        .single();

      if (cardError) throw cardError;

      // 3. Inserir Prêmios
      const prizesToInsert = values.prizes.map(p => ({
        ...p,
        scratch_card_id: card.id,
        quantity_remaining: p.quantity_total
      }));

      const { error: prizesError } = await supabase
        .from("scratch_card_prizes")
        .insert(prizesToInsert);

      if (prizesError) throw prizesError;

      toast.success("Raspadinha criada com sucesso!");
      navigate({ to: "/admin/raspadinhas" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar raspadinha");
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // Basic validation before moving
    if (currentStep === 0) {
      const name = form.getValues("name");
      if (!name || name.length < 3) {
        form.trigger("name");
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  return (
    <AdminShell>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin/raspadinhas" })}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nova Raspadinha</h1>
            <p className="text-sm text-muted-foreground">Siga os passos para configurar o novo jogo.</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between px-2 py-4 border-b border-border/50">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <div className={`
                size-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${index === currentStep ? 'bg-primary text-primary-foreground' : 
                  index < currentStep ? 'bg-success/20 text-success' : 'bg-surface border border-border text-muted-foreground'}
              `}>
                {index < currentStep ? <Check className="size-4" /> : index + 1}
              </div>
              <span className={`ml-2 text-xs font-medium hidden sm:inline ${index === currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                {step}
              </span>
              {index < STEPS.length - 1 && (
                <ChevronRight className="mx-4 size-4 text-muted-foreground opacity-30" />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-surface border border-border rounded-3xl p-6 sm:p-10 shadow-sm">
            
            {/* Step 0: Informações */}
            {currentStep === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Raspadinha</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mega Sorte 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Explique como o jogo funciona..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 1: Visual */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="aspect-[3/4] rounded-2xl bg-primary/5 border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-center">
                    <ImageIcon className="size-10 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">Imagem de Capa</p>
                    <p className="text-xs text-muted-foreground mt-1">Visível no catálogo</p>
                    <Button variant="outline" size="sm" className="mt-4" type="button">Selecionar Arquivo</Button>
                  </div>
                  <div className="aspect-[3/4] rounded-2xl bg-primary/5 border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-center">
                    <ImageIcon className="size-10 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">Camada de Raspagem</p>
                    <p className="text-xs text-muted-foreground mt-1">A imagem que será raspada</p>
                    <Button variant="outline" size="sm" className="mt-4" type="button">Selecionar Arquivo</Button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Preço e Status */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço por Jogada (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_free"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Raspadinha Grátis</FormLabel>
                          <FormDescription>Permite jogar sem cobrar do saldo</FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Destaque na Home</FormLabel>
                        <FormDescription>Exibir nos primeiros slots da página inicial</FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Prêmios */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold flex items-center gap-2">
                    <Trophy className="size-4 text-primary" /> Tabela de Prêmios
                  </h3>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const prizes = form.getValues("prizes");
                      form.setValue("prizes", [...prizes, { title: `Prêmio ${prizes.length + 1}`, value: 0, probability: 0, quantity_total: 10, is_active: true }]);
                    }}
                  >
                    <Plus className="size-4 mr-2" /> Adicionar
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.watch("prizes").map((_, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 items-end">
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`prizes.${index}.title`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Título</FormLabel>
                              <FormControl><Input {...field} /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name={`prizes.${index}.value`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Valor (R$)</FormLabel>
                              <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div>
                        <FormField
                          control={form.control}
                          name={`prizes.${index}.probability`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Prob. (0 a 1)</FormLabel>
                              <FormControl><Input type="number" step="0.0001" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex items-center justify-end">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => {
                            const prizes = form.getValues("prizes");
                            if (prizes.length > 1) {
                              form.setValue("prizes", prizes.filter((_, i) => i !== index));
                            }
                          }}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-accent/5 border border-accent/10 flex items-center gap-3">
                  <Info className="size-5 text-accent" />
                  <div className="text-xs text-muted-foreground">
                    A soma das probabilidades dos prêmios não deve exceder 1.0 (100%). O restante será automaticamente considerado como "Sem Prêmio".
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Revisão */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="surface-card p-6 space-y-4">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Nome</span>
                    <span className="font-bold">{form.watch("name")}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Preço</span>
                    <span className="font-bold text-primary">{formatCurrency(form.watch("price"))}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Total de Prêmios</span>
                    <span className="font-bold">{form.watch("prizes").length} categorias</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Status Inicial</span>
                    <span className="font-bold text-warning">{form.watch("status")}</span>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Publicar como:</FormLabel>
                      <div className="flex gap-4">
                        {["DRAFT", "ACTIVE"].map((s) => (
                          <Button
                            key={s}
                            type="button"
                            variant={field.value === s ? "default" : "outline"}
                            onClick={() => field.onChange(s)}
                            className="flex-1"
                          >
                            {s === "ACTIVE" ? "Ativo (Público)" : "Rascunho"}
                          </Button>
                        ))}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-border/50">
              <Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 0}>
                Anterior
              </Button>
              
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Próximo Passo <ArrowRight className="ml-2 size-4" />
                </Button>
              ) : (
                <Button type="submit" disabled={isSubmitting} className="bg-gradient-brand text-primary-foreground">
                  {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                  Finalizar e Salvar
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </AdminShell>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function Loader2({ className }: { className?: string }) {
  return <Info className={`animate-spin ${className}`} />;
}
