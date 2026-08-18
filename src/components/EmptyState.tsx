import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        {icon ?? <Inbox className="size-6" />}
      </span>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ModuleUnderConstruction({ module }: { module: string }) {
  return (
    <EmptyState
      title={`${module} — módulo em construção`}
      description="A estrutura de navegação já está pronta. As funcionalidades deste módulo serão entregues nas próximas etapas."
    />
  );
}
