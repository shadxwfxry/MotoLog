/**
 * Google encoded-polyline codec.
 *
 * A ride is stored as one encoded string rather than a row per GPS point.
 * Coordinates are delta-encoded at 1e-5 degree precision (~1.1 m), which is
 * finer than consumer GPS accuracy, and typically compresses a track to about
 * an eighth of the equivalent JSON.
 *
 * Implemented here rather than pulled in as a dependency: the format is ~40
 * lines, and the round trip is exactly the kind of thing worth owning tests for.
 */

const PRECISION = 1e5;

function encodeSigned(value: number, out: string[]): void {
  // Zig-zag: move the sign into the low bit so small negatives stay short.
  let v = value < 0 ? ~(value << 1) : value << 1;

  while (v >= 0x20) {
    out.push(String.fromCharCode((0x20 | (v & 0x1f)) + 63));
    v >>>= 5;
  }
  out.push(String.fromCharCode(v + 63));
}

export interface LatLon {
  lat: number;
  lon: number;
}

export function encodePolyline(points: readonly LatLon[]): string {
  const out: string[] = [];
  let prevLat = 0;
  let prevLon = 0;

  for (const point of points) {
    // Round before differencing so rounding error cannot accumulate along the
    // track — each delta is computed from already-quantised values.
    const lat = Math.round(point.lat * PRECISION);
    const lon = Math.round(point.lon * PRECISION);

    encodeSigned(lat - prevLat, out);
    encodeSigned(lon - prevLon, out);

    prevLat = lat;
    prevLon = lon;
  }

  return out.join("");
}

export function decodePolyline(encoded: string): LatLon[] {
  const points: LatLon[] = [];
  let index = 0;
  let lat = 0;
  let lon = 0;

  while (index < encoded.length) {
    lat += decodeSigned();
    lon += decodeSigned();
    points.push({ lat: lat / PRECISION, lon: lon / PRECISION });
  }

  return points;

  function decodeSigned(): number {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    return result & 1 ? ~(result >> 1) : result >> 1;
  }
}

/**
 * Per-fix series stored alongside the polyline, index-aligned with its points.
 * Kept parallel rather than as objects so the JSON stays compact.
 */
export interface TripSamples {
  /** Seconds since the trip started. */
  t: number[];
  /** km/h. */
  speed: number[];
  /** Degrees of lean; null where the device had no orientation sensor. */
  lean?: (number | null)[];
}
