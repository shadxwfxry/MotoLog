import React from "react";

export default function GarageLoading() {
  return (
    <div className="max-w-screen-lg mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Header Area */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-32 bg-muted rounded-xl" />
          <div className="h-4 w-48 bg-muted/60 rounded-xl" />
        </div>
        <div className="h-10 w-28 bg-muted rounded-xl" />
      </div>

      {/* Grid List */}
      <div className="grid gap-6 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-48 rounded-3xl border border-border bg-card/50 p-6 flex flex-col justify-between">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-3 flex-1">
                {/* Vehicle Make/Model */}
                <div className="h-6 w-36 bg-muted rounded-md" />
                {/* Year/Specs */}
                <div className="h-4 w-20 bg-muted/60 rounded-md" />
              </div>
              {/* Photo box placeholder */}
              <div className="w-16 h-16 bg-muted/70 rounded-2xl" />
            </div>
            {/* Action/specs indicators row */}
            <div className="flex gap-2">
              <div className="h-3 w-16 bg-muted/50 rounded-md" />
              <div className="h-3 w-16 bg-muted/50 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
