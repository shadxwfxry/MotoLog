"use client";

import { deleteVehicle, clearVehicleStats } from "@/lib/actions/vehicle";
import { useState } from "react";

export function VehicleActions({ vehicleId }: { vehicleId: string }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vehicle? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await deleteVehicle(vehicleId);
    } catch (e) {
      alert("Failed to delete vehicle");
      setIsDeleting(false);
    }
  };

  const handleClearStats = async () => {
    if (!confirm("Are you sure you want to clear all history for this vehicle?")) return;
    setIsCleaning(true);
    try {
      await clearVehicleStats(vehicleId);
    } catch (e) {
      alert("Failed to clear stats");
    } finally {
      setIsCleaning(false);
    }
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
