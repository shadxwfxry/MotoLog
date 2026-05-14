"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { useLanguage } from "./LanguageProvider";

interface ExportPdfButtonProps {
  vehicle: {
    make: string;
    model: string;
    year: number;
    engineDisplacement: number | null;
  };
  refuels: any[];
  maintenance: any[];
  stats: {
    totalFuel: number;
    totalMaint: number;
    avgCons: number | null;
  };
}

export function ExportPdfButton({ vehicle, refuels, maintenance, stats }: ExportPdfButtonProps) {
  const { t } = useLanguage();

  const handleExport = () => {
    const doc = new jsPDF();
    const title = `${vehicle.make} ${vehicle.model} (${vehicle.year})`;
    
    // Header
    doc.setFontSize(22);
    doc.text("MotoLog Service History", 14, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(title, 14, 30);
    
    // Quick Stats
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Fuel Cost: ${stats.totalFuel.toFixed(2)}`, 14, 45);
    doc.text(`Total Maintenance: ${stats.totalMaint.toFixed(2)}`, 14, 52);
    if (stats.avgCons) {
      doc.text(`Avg. Consumption: ${stats.avgCons.toFixed(2)} L/100km`, 14, 59);
    }

    // Refueling Table
    doc.setFontSize(14);
    doc.text("Refueling History", 14, 75);
    
    const refuelingData = refuels.map(r => [
      new Date(r.date).toLocaleDateString(),
      `${r.odometer} km`,
      `${r.liters} L`,
      `${r.cost.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Date", "Odometer", "Liters", "Cost"]],
      body: refuelingData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] }
    });

    // Maintenance Table
    const finalY = (doc as any).lastAutoTable.finalY || 80;
    doc.setFontSize(14);
    doc.text("Maintenance History", 14, finalY + 15);

    const maintenanceData = maintenance.map(m => [
      new Date(m.date).toLocaleDateString(),
      `${m.odometer} km`,
      m.type,
      `${m.cost.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [["Date", "Odometer", "Type", "Cost"]],
      body: maintenanceData,
      theme: 'grid',
      headStyles: { fillColor: [230, 126, 34] }
    });

    doc.save(`motolog_${vehicle.make}_${vehicle.model}.pdf`);
  };

  return (
    <button 
      onClick={handleExport}
      className="block w-full text-center py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition shadow-lg shadow-red-500/20 text-sm mt-4"
    >
      📄 {t("export_pdf")}
    </button>
  );
}
