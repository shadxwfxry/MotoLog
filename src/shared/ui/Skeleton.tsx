import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Loading placeholder. A shimmer travelling across a hairline block rather than
 * an opacity pulse — it reads as "data arriving" instead of "something broke",
 * and matches the sweep used on the live panels.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-foreground/[0.06]",
        className,
      )}
    >
      <span aria-hidden className="sweep-line" />
    </div>
  );
}

/** Panel-shaped placeholder, so skeletons keep the same frame as real content. */
export function SkeletonPanel({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  return <div className={cn("hud-panel p-5 sm:p-6", className)}>{children}</div>;
}
