import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { BrandLogo } from "./SiteHeader";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-hero-glow flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <div className="surface-card mt-6 p-6 sm:p-8">
          <h1 className="font-display text-xl font-semibold">{title}</h1>
          {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted-foreground">{footer}</div>}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Voltar para o início
          </Link>
        </p>
      </div>
    </div>
  );
}
