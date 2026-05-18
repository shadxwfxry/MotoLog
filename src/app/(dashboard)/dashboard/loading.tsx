import React from "react";

export default function DashboardLoading() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-8 pb-24 animate-pulse">
      {/* Title & Subtitle */}
      <div className="space-y-3">
        <div className="h-7 w-32 bg-muted rounded-xl" />
        <div className="h-4 w-64 bg-muted/60 rounded-xl" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-28 bg-card border border-border/80 rounded-3xl p-6 flex flex-col justify-between items-center">
            <div className="h-3 w-16 bg-muted/70 rounded-md" />
            <div className="h-6 w-20 bg-muted rounded-md" />
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Card Skeleton */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 h-64">
          <div className="h-4 w-28 bg-muted rounded-md" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-24 bg-muted/80 rounded-md" />
                  <div className="h-4 w-12 bg-muted rounded-md" />
                </div>
                <div className="h-2 w-full bg-muted/50 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Card Skeleton */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 h-64">
          <div className="h-4 w-32 bg-muted rounded-md" />
          <div className="space-y-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-16 bg-muted/80 rounded-md" />
                  <div className="h-3 w-8 bg-muted/50 rounded-md" />
                </div>
                <div className="h-4 w-14 bg-muted rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
