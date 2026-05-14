// ─── Vehicle & Logs ────────────────────────────────────────────────────────

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  year: number;
  brandName?: string | null;
  photoUrl?: string | null;
  type: string;
  engineDisplacement?: number | null;
  power?: number | null;
  weight?: number | null;
  userId: string;
  isPublic: boolean;
  slug: string;
};

export type RefuelingLog = {
  id: string;
  vehicleId: string;
  date: Date | string;
  odometer: number;
  liters: number;
  pricePerLiter?: number | null;
  cost: number;
  stationName?: string | null;
  fuelGrade?: string | null;
  notes?: string | null;
  isPublic: boolean;
};

export type MaintenanceLog = {
  id: string;
  vehicleId: string;
  date: Date | string;
  odometer: number;
  category: string;
  type: string;
  cost: number;
  description?: string | null;
  parts?: Part[];
  isPublic: boolean;
};

export type Part = {
  id: string;
  maintenanceLogId: string;
  name: string;
  price?: number | null;
};

export type PlannedMaintenance = {
  id: string;
  vehicleId: string;
  type: string;
  category: string;
  targetOdometer?: number | null;
  targetDate?: Date | string | null;
  intervalKm?: number | null;
  isCompleted: boolean;
  description?: string | null;
};

// ─── Search ─────────────────────────────────────────────────────────────────

export type LogEntry = {
  id: string;
  date: Date | string;
  vehicle: { make: string; model: string };
  content: string;
  type: "refuel" | "maintenance";
};

// ─── User ────────────────────────────────────────────────────────────────────

export type UserSettings = {
  id: string;
  userId: string;
  newsPreferences: string;
  theme: string;
  accentColor: string;
};

// ─── News ────────────────────────────────────────────────────────────────────

export type MotoNews = {
  title: string;
  link: string;
  pubDate: string;
  contentSnippet: string;
  source: string;
};
