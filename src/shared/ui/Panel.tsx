import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The app's one surface primitive.
 *
 * Every screen previously hand-rolled its own `rounded-2xl border border-border
 * bg-card p-5 shadow-sm`, and they had drifted apart — three radii, four
 * paddings, two shadow recipes. Panel is deliberately the only way to make a
 * surface so that retuning the design means editing one file.
 *
 * No `"use client"`: these are pure presentation and must stay usable from
 * server components.
 */

type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Draws HUD targeting brackets on two corners. For hero panels only. */
  corners?: boolean;
  /** Lifts and picks up an accent edge on hover. For panels that are links. */
  interactive?: boolean;
  /** A slow highlight travelling across the surface. Use on one panel per view. */
  sweep?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
};

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

export function Panel({
  corners = false,
  interactive = false,
  sweep = false,
  padding = "md",
  className,
  children,
  ...props
}: PanelProps) {
  return (
    <div
      className={cn(
        interactive ? "hud-panel-interactive" : "hud-panel",
        corners && "hud-corners",
        sweep && "overflow-hidden",
        PADDING[padding],
        className,
      )}
      {...props}
    >
      {sweep && <span aria-hidden className="sweep-line" />}
      {children}
    </div>
  );
}

/**
 * Section label above a panel's content. Small, wide-tracked, with a short
 * accent rule — the recurring "instrument label" of the design.
 */
export function PanelTitle({
  children,
  icon,
  action,
  className,
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
        {icon && <span className="text-primary">{icon}</span>}
        {children}
        <span aria-hidden className="h-px w-8 bg-primary/50" />
      </h3>
      {action}
    </div>
  );
}
