import React from "react";
import { PageShell } from "@/shared/ui";
import { Skeleton, SkeletonPanel } from "@/shared/ui/Skeleton";

export default function GarageLoading() {
  return (
    <PageShell>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-9 w-44" />
        </div>
        <Skeleton className="h-11 w-36" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <SkeletonPanel key={i} className="p-0">
            <Skeleton className="h-52 w-full rounded-b-none" />
            <div className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-6 w-28" />
              </div>
              <Skeleton className="h-10 w-10" />
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </PageShell>
  );
}
