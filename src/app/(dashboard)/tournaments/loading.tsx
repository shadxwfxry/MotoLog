import React from "react";
import { Skeleton, SkeletonPanel } from "@/shared/ui/Skeleton";

export default function TournamentsLoading() {
  return (
    <div className="mx-auto w-full max-w-screen-lg space-y-4 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
        <Skeleton className="h-11 w-32" />
      </div>

      <SkeletonPanel className="p-0">
        <Skeleton className="h-[70vh] min-h-[520px] w-full rounded-lg" />
      </SkeletonPanel>
    </div>
  );
}
