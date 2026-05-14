"use client";

import { useEffect, useRef } from "react";

interface GoogleSearchModalProps {
  open: boolean;
  query: string;
  onClose: () => void;
}

const CSE_ID = "90f1e9813713941cc";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
    __gcse?: {
      parsetags?: string;
      initializationCallback?: () => void;
    };
  }
}

export function GoogleSearchModal({ open, query, onClose }: GoogleSearchModalProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!open) return;

    // Load CSE script once
    if (!document.getElementById("google-cse-script")) {
      window.__gcse = { parsetags: "explicit" };
      const script = document.createElement("script");
      script.id = "google-cse-script";
      script.src = `https://cse.google.com/cse.js?cx=${CSE_ID}`;
      script.async = true;
      document.head.appendChild(script);
    }

    // Poll until the CSE element API is ready, then execute search
    const interval = setInterval(() => {
      try {
        const cse = window.google?.search?.cse?.element;
        if (cse) {
          if (!initialized.current) {
            // Render the full search widget but we can hide the input if we want
            // using "search" instead of "searchresults-only" is often more reliable
            cse.render({
              div: "google-cse-results",
              tag: "search",
              gname: "motolog-search"
            });
            initialized.current = true;
          }
          const el = cse.getElement("motolog-search");
          if (el && query) {
            el.execute(query);
            clearInterval(interval);
          }
        }
      } catch {
        // CSE not ready yet, keep polling
      }
    }, 200);

    return () => clearInterval(interval);
  }, [open, query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Web Search"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-card/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Web Search</p>
            <p className="text-sm font-bold truncate max-w-[220px] sm:max-w-xs">{query}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          aria-label="Close search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
          </svg>
        </button>
      </div>

      {/* Google CSE results */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div id="google-cse-results" className="gcse-searchresults-only w-full" />
      </div>
    </div>
  );
}
