import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, Sparkles, ShieldCheck, LogOut, LayoutDashboard, Wallet } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";

const NAV_ITEMS = [
  { to: "/", label: "Início" },
  { to: "/raspadinhas", label: "Raspadinhas" },
  { to: "/ganhadores", label: "Ganhadores" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/faq", label: "Ajuda" },
  { to: "/suporte", label: "Suporte" },
] as const;

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { siteName, logoUrl } = useSettings();
  
  return (
    <Link to="/" className="flex items-center gap-2.5">
      {logoUrl && logoUrl !== "null" && logoUrl !== "" ? (
        <img src={logoUrl} alt={siteName} className="h-9 w-auto object-contain" />
      ) : (
        <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
          <Sparkles className="size-5" />
        </span>
      )}
      {(!compact && !logoUrl) && (
        <span className="font-display text-lg font-semibold tracking-tight">
          {siteName.includes("Premium") ? (
            <>
              {siteName.replace("Premium", "")}<span className="text-gradient-brand">Premium</span>
            </>
          ) : siteName}
        </span>
      )}
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isStaff, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    setOpen(false);
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <BrandLogo />

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "text-foreground bg-secondary" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {isAuthenticated ? (
            <>
              <Button asChild variant="ghost" size="sm" className="text-primary hover:text-primary hover:bg-primary/10">
                <Link to="/carteira">
                  <Wallet className="size-4" /> Carteira
                </Link>
              </Button>
              {isStaff && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/admin">
                    <ShieldCheck className="size-4" /> Admin
                  </Link>
                </Button>
              )}
              <Button asChild variant="secondary" size="sm">
                <Link to="/dashboard">
                  <LayoutDashboard className="size-4" />
                  {profile?.full_name?.split(" ")[0] ?? "Painel"}
                </Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sair">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-brand text-primary-foreground">
                <Link to="/cadastro">Criar conta</Link>
              </Button>
            </>
          )}
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Abrir menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[86vw] max-w-sm border-border bg-background">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="mt-2 flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-base text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "text-foreground bg-secondary" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Button asChild variant="secondary">
                    <Link to="/dashboard" onClick={() => setOpen(false)}>
                      Meu painel
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="text-primary border-primary/20 bg-primary/5">
                    <Link to="/carteira" onClick={() => setOpen(false)}>
                      <Wallet className="size-4 mr-2 inline" /> Minha Carteira
                    </Link>
                  </Button>
                  {isStaff && (
                    <Button asChild variant="outline">
                      <Link to="/admin" onClick={() => setOpen(false)}>
                        Painel administrativo
                      </Link>
                    </Button>
                  )}
                  <Button variant="ghost" onClick={handleSignOut}>
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="bg-gradient-brand text-primary-foreground">
                    <Link to="/cadastro" onClick={() => setOpen(false)}>
                      Criar conta
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/login" onClick={() => setOpen(false)}>
                      Entrar
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
