import type { ReactNode } from "react";

interface PageProps {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function Page({ title, description, actions, children }: PageProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
