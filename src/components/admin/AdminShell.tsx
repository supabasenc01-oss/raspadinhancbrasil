import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/hooks/useSettings";
import { useState, type ReactNode } from "react";
import {
  BarChart3,
  Banknote,
  Gift,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  Ticket,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BrandLogo } from "@/components/layout/SiteHeader";
import { ROLE_LABELS, useAuth } from "@/hooks/useAuth";

const ADMIN_NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/raspadinhas", label: "Raspadinhas", icon: Ticket },
  { to: "/admin/premios", label: "Prêmios", icon: Gift },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/ganhadores", label: "Ganhadores", icon: Trophy },
  { to: "/admin/financeiro", label: "Financeiro", icon: Banknote },
  { to: "/admin/relatorios", label: "Relatórios", icon: BarChart3 },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
          }}
        >
          <item.icon className="size-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function AdminShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const { loading, isStaff, roles, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/", replace: true });
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Carregando painel...
      </div>
    );
  }

  if (!isStaff) {
    return (
      <div className="grid min-h-screen place-items-center bg-background px-4">
        <div className="surface-card max-w-md p-8 text-center">
          <h1 className="font-display text-xl font-semibold">Acesso restrito</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sua conta não possui permissão administrativa. Fale com um administrador da plataforma.
          </p>
          <Button asChild className="mt-6" variant="secondary">
            <Link to="/dashboard">Voltar ao meu painel</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 lg:flex lg:flex-col">
        <div className="px-2 py-2">
          <BrandLogo />
        </div>
        <div className="mt-6 flex-1">
          <NavList />
        </div>
        <div className="surface-card mt-4 p-3 text-xs">
          <p className="font-medium">{profile?.full_name ?? profile?.email ?? "Equipe"}</p>
          <p className="mt-1 text-muted-foreground">
            {roles.map((role) => ROLE_LABELS[role]).join(", ") || "—"}
          </p>
          <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" aria-label="Abrir menu administrativo">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[82vw] max-w-xs border-sidebar-border bg-sidebar">
                <SheetTitle className="sr-only">Menu administrativo</SheetTitle>
                <div className="mt-2">
                  <BrandLogo />
                </div>
                <div className="mt-6">
                  <NavList onNavigate={() => setOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-display text-sm font-semibold sm:text-base">Painel administrativo</span>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">Ver site</Link>
          </Button>
        </header>

        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold">{title}</h1>
              {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
            </div>
            {actions}
          </div>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
