import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "./StatTile";

const TONE: Record<Tone, string> = {
  default: "border-[hsl(var(--hairline))] bg-foreground/[0.05] text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  cyan: "border-signal-cyan/30 bg-signal-cyan/10 text-signal-cyan",
  lime: "border-signal-lime/30 bg-signal-lime/10 text-signal-lime",
  amber: "border-signal-amber/30 bg-signal-amber/10 text-signal-amber",
  rose: "border-signal-rose/30 bg-signal-rose/10 text-signal-rose",
  violet: "border-signal-violet/30 bg-signal-violet/10 text-signal-violet",
};

export function Badge({
  children,
  tone = "default",
  dot = false,
  pulse = false,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  /** Leading status dot — the "live indicator" used for states, not labels. */
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("chip", TONE[tone], className)}>
      {dot && (
        <span aria-hidden className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
          )}
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
        </span>
      )}
      {children}
    </span>
  );
}

/** Placeholder for an empty list — a framed, dashed void rather than bare text. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border border-dashed px-6 py-16 text-center",
        "border-[hsl(var(--hairline))] bg-card/30 backdrop-blur-sm",
        className,
      )}
    >
      {icon && <div className="mb-4 text-4xl opacity-30 grayscale">{icon}</div>}
      <p className="font-display text-base font-bold uppercase tracking-wide">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
