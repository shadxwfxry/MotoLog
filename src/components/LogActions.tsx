"use client";

import { useState } from "react";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { deleteRefuelLog, toggleRefuelPublic } from "@/features/fuel/actions";
import { deleteMaintenanceLog, toggleMaintenancePublic } from "@/features/maintenance/actions";

interface Props {
  logId: string;
  type: "refuel" | "maintenance";
  isPublic: boolean;
}

export function LogActions({ logId, type, isPublic }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this entry?")) return;
    setLoading(true);

    const result =
      type === "refuel" ? await deleteRefuelLog(logId) : await deleteMaintenanceLog(logId);

    if (!result.ok) alert(result.error);
    setLoading(false);
  };

  const handleTogglePublic = async () => {
    setLoading(true);

    const result =
      type === "refuel"
        ? await toggleRefuelPublic(logId, !isPublic)
        : await toggleMaintenancePublic(logId, !isPublic);

    if (!result.ok) alert(result.error);
    setLoading(false);
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={handleTogglePublic}
        disabled={loading}
        title={isPublic ? "Hide from public" : "Show on public"}
        className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors disabled:opacity-50 ${
          isPublic
            ? "text-primary hover:bg-primary/10"
            : "text-muted-foreground hover:bg-foreground/[0.06]"
        }`}
      >
        {isPublic ? <Eye size={15} strokeWidth={2.2} /> : <EyeOff size={15} strokeWidth={2.2} />}
      </button>

      <button
        onClick={handleDelete}
        disabled={loading}
        title="Delete entry"
        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      >
        <Trash2 size={15} strokeWidth={2.2} />
      </button>
    </div>
  );
}
