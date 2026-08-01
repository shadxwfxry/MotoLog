import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The masthead every route opens with: a tracked eyebrow, an oversized display
 * title and an optional action rail. Consistent here is what makes the app feel
 * like one product rather than nine separately-built pages.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-wrap items-end justify-between gap-4", className)}>
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <p className="eyebrow">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-primary shadow-glow" />
            {eyebrow}
          </p>
        )}
        <h1 className="text-3xl font-black uppercase leading-none tracking-tight sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </header>
  );
}

/** Standard page frame: max width, gutters, vertical rhythm, dock clearance. */
export function PageShell({
  children,
  className,
  width = "lg",
}: {
  children: React.ReactNode;
  className?: string;
  width?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-8 sm:px-6",
        width === "md" ? "max-w-screen-md" : "max-w-screen-lg",
        "space-y-8",
        className,
      )}
    >
      {children}
    </div>
  );
}
