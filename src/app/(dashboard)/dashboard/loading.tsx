import React from "react";
import { PageShell } from "@/shared/ui";
import { Skeleton, SkeletonPanel } from "@/shared/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <PageShell>
      <div className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonPanel key={i} className="p-4 sm:p-5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="mt-3 h-7 w-24" />
          </SkeletonPanel>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((panel) => (
          <SkeletonPanel key={panel}>
            <Skeleton className="mb-5 h-3 w-28" />
            <div className="space-y-4">
              {[0, 1, 2].map((row) => (
                <div key={row} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-14" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          </SkeletonPanel>
        ))}
      </div>
    </PageShell>
  );
}
