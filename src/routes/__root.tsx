import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";
import { useFileUrl } from "@/hooks/useFileUrl";
import { Toaster } from "@/components/ui/sonner";
import { UserFloatingBubbles } from "@/components/home/UserFloatingBubbles";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-gradient-brand text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A página que você procura não existe ou foi movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-gradient-brand px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Ir para o início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0F172A] p-4 text-white">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-red-500/10 text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          erro de carregamento da página
        </h1>
        <p className="text-slate-400">
          erro de carregamento da página
        </p>
        {process.env['NODE_ENV'] === "development" && (
          <div className="mt-4 overflow-auto rounded-lg bg-black/40 p-4 text-left text-xs font-mono text-red-400 max-h-[200px]">
            {error instanceof Error ? error.message : String(error)}
          </div>
        )}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[#3B82F6] px-8 text-sm font-bold transition-transform hover:scale-105 active:scale-95"
          >
            Tentar Novamente
          </button>
          <a
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white/5 px-8 text-sm font-bold border border-white/10 hover:bg-white/10 transition-colors"
          >
            Voltar ao Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Carregando..." },
      {
        name: "description",
        content: "Plataforma premium de raspadinhas online com prêmios e experiência mobile first.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=Manrope:wght@400;500;600&display=swap",
      },
      { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootContent />
        <UserFloatingBubbles />
        <Toaster position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootContent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  
  // Use useSettings only if queryClient is available in context (it is, because of the provider above)
  const settings = useSettings();
  const { siteName, metaDescription, faviconUrl: rawFaviconUrl } = settings;
  // Use the update timestamp or a version string from settings as cache bust
  const faviconCacheBust = settings.settings?.find((s: any) => s.key === 'favicon_url')?.updated_at || '';
  const faviconUrl = useFileUrl(rawFaviconUrl, faviconCacheBust);

  useEffect(() => {
    // Dynamic Head update for Name, Description and Favicon
    if (typeof document !== "undefined") {
      document.title = `${siteName} — Raspadinhas online`;
      
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", metaDescription);

      const favicon = document.querySelector('link[rel="icon"]');
      if (favicon && faviconUrl) favicon.setAttribute("href", faviconUrl);
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED" && event !== "TOKEN_REFRESHED") return;
      
      router.invalidate();
      
      if (event === "SIGNED_OUT") {
        queryClient.clear();
      } else {
        queryClient.invalidateQueries();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [queryClient, router, siteName, metaDescription, faviconUrl]);

  const {
    brandStartColor,
    brandEndColor,
    accentStartColor,
    accentEndColor
  } = settings;

  return (
    <div 
      className="min-h-screen bg-background"
      style={{
        // @ts-ignore - custom properties
        '--color-brand-start': brandStartColor,
        '--color-brand-end': brandEndColor,
        '--color-accent-start': accentStartColor,
        '--color-accent-end': accentEndColor,
      }}
    >
      <Outlet />
    </div>
  );
}
