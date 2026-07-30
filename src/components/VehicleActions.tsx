"use client";

import { useState } from "react";
import { clearVehicleStats, deleteVehicle } from "@/features/garage/actions";

export function VehicleActions({ vehicleId }: { vehicleId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) return;
    setIsDeleting(true);

    // On success the action redirects, so control never returns here.
    const result = await deleteVehicle(vehicleId);
    if (!result.ok) {
      alert(result.error);
      setIsDeleting(false);
    }
  };

  const handleClearStats = async () => {
    if (!confirm("Are you sure you want to clear all history for this vehicle?")) return;
    setIsCleaning(true);

    const result = await clearVehicleStats(vehicleId);
    if (!result.ok) alert(result.error);
    setIsCleaning(false);
  };

  return (
    <div className="space-y-2 pt-4 border-t border-border">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Danger Zone</p>
      <button
        onClick={handleClearStats}
        disabled={isCleaning}
        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 transition disabled:opacity-50"
      >
        {isCleaning ? "Cleaning..." : "🧹 Clear All History"}
      </button>
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "🗑 Delete Vehicle"}
      </button>
    </div>
  );
}
