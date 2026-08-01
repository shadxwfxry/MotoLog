import * as React from "react";
import { cn } from "@/lib/utils";
import { Panel } from "./Panel";

export type Tone = "default" | "primary" | "cyan" | "lime" | "amber" | "rose" | "violet";

/**
 * Tone maps to a text colour, a tinted wash and an edge. Kept as one table so a
 * tone can never be half-applied — the old code coloured the number but forgot
 * the border on some cards and the wash on others.
 */
const TONE: Record<Tone, { text: string; wash: string; edge: string }> = {
  default: { text: "text-foreground", wash: "", edge: "" },
  primary: { text: "text-primary", wash: "bg-primary/[0.07]", edge: "border-primary/30" },
  cyan: { text: "text-signal-cyan", wash: "bg-signal-cyan/[0.07]", edge: "border-signal-cyan/30" },
  lime: { text: "text-signal-lime", wash: "bg-signal-lime/[0.07]", edge: "border-signal-lime/30" },
  amber: { text: "text-signal-amber", wash: "bg-signal-amber/[0.07]", edge: "border-signal-amber/30" },
  rose: { text: "text-signal-rose", wash: "bg-signal-rose/[0.07]", edge: "border-signal-rose/30" },
  violet: { text: "text-signal-violet", wash: "bg-signal-violet/[0.07]", edge: "border-signal-violet/30" },
};

/** A single readout: micro label above, oversized tabular figure below. */
export function StatTile({
  label,
  value,
  hint,
  tone = "default",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const t = TONE[tone];

  return (
    <Panel
      padding="none"
      className={cn("group overflow-hidden p-4 sm:p-5", t.wash, t.edge, className)}
    >
      <p className="label-micro truncate">{label}</p>
      {/* `leading-none` looked right on one line and collided on two — values
          like "55.63 ₴/L" do wrap in the narrow five-up grid. */}
      <p className={cn("num mt-2 text-xl font-black leading-[1.1] sm:text-2xl", t.text)}>
        {value}
      </p>
      {hint && <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{hint}</p>}
    </Panel>
  );
}

/**
 * The compact variant used inside cards (ride rows, vehicle cards) where a full
 * Panel would nest a surface inside a surface.
 */
export function MiniStat({
  label,
  value,
  tone = "default",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md bg-foreground/[0.04] px-2 py-2 text-center", className)}>
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className={cn("num mt-0.5 text-sm font-bold", TONE[tone].text)}>{value}</p>
    </div>
  );
}
