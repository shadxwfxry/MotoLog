"use client";

import { deleteRefuelLog, toggleRefuelPublic } from "@/lib/actions/refuel";
import { deleteMaintenanceLog, toggleMaintenancePublic } from "@/lib/actions/maintenance";
import { useState } from "react";

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
    try {
      if (type === "refuel") await deleteRefuelLog(logId);
      else await deleteMaintenanceLog(logId);
    } catch (e) {
      alert("Error deleting");
      setLoading(false);
    }
  };

  const handleTogglePublic = async () => {
    setLoading(true);
    try {
      if (type === "refuel") await toggleRefuelPublic(logId, !isPublic);
      else await toggleMaintenancePublic(logId, !isPublic);
    } catch (e) {
      alert("Error updating visibility");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-1">
      <button
        onClick={handleTogglePublic}
        disabled={loading}
        title={isPublic ? "Hide from public" : "Show on public"}
        className={`p-1.5 rounded-lg transition ${isPublic ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-muted"}`}
      >
        {isPublic ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        title="Delete entry"
        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
      </button>
    </div>
  );
}
