import { NextResponse } from "next/server";
import { vehicleRepository } from "@/server/repositories/vehicleRepository";
import { logger } from "@/shared/lib/logger";

/**
 * Public vehicle card for tournament QR scanning. CORS is open by design, and
 * the repository selects only presentational fields — no logs, no owner email.
 */
const CORS_HEADERS = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
};

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const vehicle = await vehicleRepository.findPublicCard(params.id);

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404, headers: CORS_HEADERS });
    }

    return NextResponse.json(vehicle, { status: 200, headers: CORS_HEADERS });
  } catch (error) {
    logger.error("external vehicle lookup failed", error);
    // Internal error text must not cross the CORS boundary.
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
