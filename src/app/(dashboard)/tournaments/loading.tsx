import React from "react";

export default function TournamentsLoading() {
  return (
    <div className="w-full flex flex-col h-[calc(100vh-57px-73px)] sm:h-[calc(100vh-57px-73px)] md:h-[calc(100vh-57px-73px)] overflow-hidden bg-background animate-pulse">
      {/* Toggle Bar Skeleton */}
      <div className="w-full bg-card/60 border-b border-border px-4 py-3 flex items-center justify-between h-[56px] flex-shrink-0">
        <div className="h-4 w-32 bg-muted rounded-md" />
        <div className="h-8 w-40 bg-muted rounded-xl" />
      </div>

      {/* Pulsing content area */}
      <div className="flex-1 w-full bg-card/25 flex flex-col items-center justify-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted/65 animate-bounce">
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
          <path d="M4 22h16"/>
          <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/>
          <path d="M12 2a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6a4 4 0 0 1 4-4Z"/>
        </svg>
        <div className="h-3 w-36 bg-muted/60 rounded-md" />
      </div>
    </div>
  );
}
