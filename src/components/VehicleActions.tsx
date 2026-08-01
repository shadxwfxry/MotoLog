"use client";

import { useState } from "react";
import { Eraser, Trash2 } from "lucide-react";
import { clearVehicleStats, deleteVehicle } from "@/features/garage/actions";
import { useLanguage } from "./LanguageProvider";

export function VehicleActions({ vehicleId }: { vehicleId: string }) {
  const { t } = useLanguage();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this vehicle? This action cannot be undone."))
      return;
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
    <div className="space-y-2 border-t pt-4 [border-color:hsl(var(--hairline))]">
      <p className="label-micro mb-2 text-signal-rose/70">{t("danger_zone")}</p>

      <button
        onClick={handleClearStats}
        disabled={isCleaning}
        className="btn h-11 w-full justify-start border border-signal-amber/25 bg-signal-amber/10 px-4 text-signal-amber hover:bg-signal-amber/20"
      >
        <Eraser size={14} strokeWidth={2.4} />
        {isCleaning ? `${t("loading")}…` : t("clear_all_history")}
      </button>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="btn h-11 w-full justify-start border border-destructive/25 bg-destructive/10 px-4 text-destructive hover:bg-destructive/20"
      >
        <Trash2 size={14} strokeWidth={2.4} />
        {isDeleting ? `${t("loading")}…` : t("delete_vehicle")}
      </button>
    </div>
  );
}
