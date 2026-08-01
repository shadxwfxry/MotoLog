"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dialog shell shared by the add/edit forms and the QR overlay, which had each
 * built their own backdrop with different blur, radius and close affordances.
 *
 * Closes on Escape and on backdrop click, and locks body scroll while open —
 * none of which the hand-rolled versions did.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  React.useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-md sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        // The backdrop closes the dialog; clicks inside it must not bubble up.
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "hud-panel hud-corners my-auto w-full max-w-lg animate-rise-in p-6 sm:p-7",
          className,
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <h2 className="font-display text-lg font-black uppercase tracking-wide">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-all hover:border-destructive/50 hover:text-destructive [border-color:hsl(var(--hairline))]"
          >
            <X size={16} strokeWidth={2.6} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

/** Labelled control used throughout the forms. */
export function FormField({
  label,
  children,
  className,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="label-micro">{label}</span>
      {children}
    </label>
  );
}
