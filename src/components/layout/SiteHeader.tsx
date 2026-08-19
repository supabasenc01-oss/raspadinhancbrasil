import { Link, useNavigate } from "@tanstack/react-router";
import { 
  Menu, 
  Sparkles, 
  ShieldCheck, 
  LogOut, 
  LayoutDashboard, 
  Wallet, 
  User as UserIcon, 
  ChevronDown, 
  Trophy, 
  Users, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  History, 
  Gamepad2 
} from "lucide-react";
import { useState } from "react";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useFileUrl } from "@/hooks/useFileUrl";
import { getWalletBalance } from "@/lib/payments.functions";
import { formatCurrency } from "@/lib/format";

const NAV_ITEMS = [
  { to: "/", label: "Início" },
  { to: "/raspadinhas", label: "Raspadinhas" },
  { to: "/ganhadores", label: "Ganhadores" },
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/faq", label: "Ajuda" },
  { to: "/suporte", label: "Suporte" },
] as const;

export function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { siteName, logoUrl: rawLogoUrl, settings } = useSettings();
  
  // Get update timestamp for cache busting
  const settingObj = Array.isArray(settings) ? settings.find((s: any) => s.key === 'logo_url') : null;
  const cacheBust = settingObj?.updated_at || new Date().getTime().toString();
  
  // Use the database URL if available, fallback to the direct file pointer
  // We avoid thumbnails for the logo to ensure high quality and avoid potential broken thumb paths
  const logoUrl = useFileUrl(rawLogoUrl || "/logo.png", cacheBust, false);
  
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="flex items-center gap-2.5">
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt={siteName} 
            className="h-9 w-auto object-contain block"
            key={logoUrl} // Force re-render on URL change
            onError={(e) => {
              console.error("[BrandLogo] Failed to load image:", logoUrl);
              e.currentTarget.style.display = 'none';
              // Find the next sibling which is the fallback text
              const fallback = e.currentTarget.nextElementSibling;
              if (fallback) fallback.classList.remove('hidden');
            }} 
          />
        ) : (
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-glow">
            <Sparkles className="size-5" />
          </span>
        )}
        
        {/* Site name - Visible as fallback if logo fails OR if there's no logoUrl */}
        {(!compact) && (
          <span className={`font-display text-lg font-black tracking-tighter uppercase italic shrink-0 ${logoUrl ? 'hidden' : ''}`}>
            {siteName.includes("Premium") ? (
              <>
                {siteName.replace("Premium", "")}<span className="text-gradient-brand">Premium</span>
              </>
            ) : siteName}
          </span>
        )}
      </div>
    </Link>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, isStaff, profile, signOut, user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchBalance = useServerFn(getWalletBalance);

  const { data: balanceData } = useQuery({
    queryKey: ['wallet-balance', user?.id],
    queryFn: () => fetchBalance({}),
    enabled: !!user?.id,
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

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
        <div className="flex items-center gap-6">
          <BrandLogo />
          <nav className="hidden items-center gap-1 lg:flex">
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
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Wallet Info - Desktop and Tablet */}
              <div className="hidden items-center gap-3 sm:flex mr-2">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Saldo</span>
                  <span className="text-sm font-bold text-primary">
                    {formatCurrency(balanceData?.balance || 0)}
                  </span>
                </div>
                <Button asChild size="sm" className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold px-4 h-9 shadow-sm">
                  <Link to="/carteira/adicionar">DEPOSITAR</Link>
                </Button>
              </div>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-10 px-2 sm:px-3 hover:bg-secondary flex items-center gap-2 group">
                    <div className="size-8 rounded-full bg-secondary flex items-center justify-center text-primary border border-border group-hover:border-primary/30 transition-colors">
                      <UserIcon className="size-4" />
                    </div>
                    <span className="hidden sm:inline-block font-bold text-sm uppercase tracking-wide">
                      {profile?.full_name?.split(" ")[0] ?? "Menu"}
                    </span>
                    <ChevronDown className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 mt-1 p-2 bg-surface border-border/50 shadow-xl rounded-xl">
                  {/* Mobile Wallet View inside Dropdown */}
                  <div className="sm:hidden px-3 py-3 mb-2 bg-secondary/50 rounded-lg flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase text-muted-foreground font-medium">Saldo</span>
                      <span className="text-sm font-bold text-primary">{formatCurrency(balanceData?.balance || 0)}</span>
                    </div>
                    <Button asChild size="sm" className="bg-[#22c55e] text-white font-bold h-7 text-[10px] px-2">
                      <Link to="/carteira/adicionar">DEPOSITAR</Link>
                    </Button>
                  </div>

                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5">
                    <Link to="/raspadinhas" className="flex items-center gap-3">
                      <Gamepad2 className="size-4 text-primary" />
                      <span className="font-medium">Jogar</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5">
                    <Link to="/dashboard" className="flex items-center gap-3">
                      <LayoutDashboard className="size-4 text-primary" />
                      <span className="font-medium">Perfil</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5">
                    <Link to="/indicacao" className="flex items-center gap-3">
                      <Users className="size-4 text-primary" />
                      <span className="font-medium">Indique e Ganhe</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/50 my-1" />

                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5">
                    <Link to="/carteira/adicionar" className="flex items-center gap-3">
                      <ArrowUpCircle className="size-4 text-green-500" />
                      <span className="font-medium">Depósito</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5">
                    <Link to="/carteira/saque" className="flex items-center gap-3">
                      <ArrowDownCircle className="size-4 text-orange-500" />
                      <span className="font-medium">Saque</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5">
                    <Link to="/carteira" className="flex items-center gap-3">
                      <History className="size-4 text-blue-500" />
                      <span className="font-medium">Transações</span>
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-border/50 my-1" />

                  {isStaff && (
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer py-2.5">
                      <Link to="/admin" className="flex items-center gap-3">
                        <ShieldCheck className="size-4 text-primary" />
                        <span className="font-medium">Painel Admin</span>
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer py-2.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <LogOut className="size-4" />
                      <span className="font-medium">Sair</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-brand text-primary-foreground font-bold px-6 shadow-glow">
                <Link to="/cadastro">CRIAR CONTA</Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm border-border bg-background flex flex-col">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="mt-6 flex flex-col gap-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-4 text-lg font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground flex items-center justify-between"
                    activeProps={{ className: "text-foreground bg-secondary" }}
                    activeOptions={{ exact: item.to === "/" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              
              {!isAuthenticated && (
                <div className="mt-auto pt-6 border-t border-border/50 flex flex-col gap-3">
                  <Button asChild className="bg-gradient-brand text-primary-foreground h-12 text-base font-bold">
                    <Link to="/cadastro" onClick={() => setOpen(false)}>
                      CRIAR MINHA CONTA
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-12 text-base">
                    <Link to="/login" onClick={() => setOpen(false)}>
                      ENTRAR
                    </Link>
                  </Button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
