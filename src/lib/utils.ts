import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className merge, used by the shadcn-style components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// formatDate moved to @/shared/lib/format, where it respects the user's locale
// instead of hardcoding en-GB.
