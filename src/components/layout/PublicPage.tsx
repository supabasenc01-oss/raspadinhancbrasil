import type { ReactNode } from "react";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function PublicPage({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  children,
  centered = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  centered?: boolean;
}) {
  return (
    <section className={`bg-hero-glow border-b border-border/60 ${centered ? 'text-center' : ''}`}>
      <div className={`mx-auto w-full max-w-6xl px-4 py-14 sm:py-20 flex flex-col ${centered ? 'items-center' : ''}`}>
        {eyebrow && (
          <span className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="mt-4 text-3xl font-bold sm:text-4xl" dangerouslySetInnerHTML={{ __html: title }} />
        {description && (
          <p className={`mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base ${centered ? 'mx-auto' : ''}`}>{description}</p>
        )}
        {children}
      </div>
    </section>
  );
}
