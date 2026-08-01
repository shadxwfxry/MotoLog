"use client";

import * as React from "react";
import { Panel } from "@/shared/ui";

/**
 * Shared frame for sign-in and registration. Both screens had drifted into
 * slightly different copies of the same markup; this keeps them identical by
 * construction.
 */
export function AuthShell({
  title,
  subtitle,
  error,
  children,
  footer,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-rise-in">
        <div className="mb-8 text-center">
          <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 shadow-glow ring-1 ring-inset ring-primary/40">
            <img src="/icon-192x192.png" alt="" className="h-9 w-9 rounded-md" />
          </span>
          <h1 className="font-display text-2xl font-black uppercase tracking-[0.2em]">
            Moto<span className="text-primary text-glow">Log</span>
          </h1>
          <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.34em] text-muted-foreground">
            Ride telemetry
          </p>
        </div>

        <Panel corners padding="lg" className="space-y-6">
          <div>
            <h2 className="font-display text-lg font-black uppercase tracking-wide">{title}</h2>
            {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive"
            >
              {error}
            </p>
          )}

          {children}

          {footer && (
            <>
              <div className="rule" />
              <div className="text-center text-sm text-muted-foreground">{footer}</div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** Labelled input, so neither auth screen hand-rolls the pairing. */
export function Field({
  label,
  hint,
  invalid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; invalid?: boolean }) {
  const id = React.useId();

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="label-micro">
        {label}
      </label>
      <input
        id={id}
        className={`field ${invalid ? "!border-destructive/60" : ""}`}
        aria-invalid={invalid || undefined}
        {...props}
      />
      {hint && <p className="text-xs text-destructive">{hint}</p>}
    </div>
  );
}
