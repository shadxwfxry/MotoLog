import { describe, expect, it } from "vitest";
import { decodePolyline, encodePolyline, type LatLon } from "./polyline";

describe("encodePolyline", () => {
  it("matches the reference encoding from Google's specification", () => {
    const points: LatLon[] = [
      { lat: 38.5, lon: -120.2 },
      { lat: 40.7, lon: -120.95 },
      { lat: 43.252, lon: -126.453 },
    ];

    expect(encodePolyline(points)).toBe("_p~iF~ps|U_ulLnnqC_mqNvxq`@");
  });

  it("encodes an empty track as an empty string", () => {
    expect(encodePolyline([])).toBe("");
  });
});

describe("decodePolyline", () => {
  it("decodes the reference encoding", () => {
    const points = decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@");

    expect(points).toHaveLength(3);
    expect(points[0].lat).toBeCloseTo(38.5, 5);
    expect(points[0].lon).toBeCloseTo(-120.2, 5);
    expect(points[2].lat).toBeCloseTo(43.252, 5);
    expect(points[2].lon).toBeCloseTo(-126.453, 5);
  });

  it("decodes an empty string to an empty track", () => {
    expect(decodePolyline("")).toEqual([]);
  });
});

describe("round trip", () => {
  const roundTrip = (points: LatLon[]) => decodePolyline(encodePolyline(points));

  it("preserves coordinates to 1e-5 degrees", () => {
    const points: LatLon[] = [
      { lat: 50.45012, lon: 30.52341 },
      { lat: 50.45098, lon: 30.52456 },
      { lat: 50.45123, lon: 30.52501 },
    ];
    const decoded = roundTrip(points);

    decoded.forEach((point, i) => {
      expect(point.lat).toBeCloseTo(points[i].lat, 5);
      expect(point.lon).toBeCloseTo(points[i].lon, 5);
    });
  });

  it("handles the southern and western hemispheres", () => {
    const points: LatLon[] = [
      { lat: -33.86785, lon: -151.20732 },
      { lat: -33.86901, lon: -151.20811 },
    ];
    const decoded = roundTrip(points);

    expect(decoded[0].lat).toBeCloseTo(-33.86785, 5);
    expect(decoded[1].lon).toBeCloseTo(-151.20811, 5);
  });

  it("handles the equator and prime meridian", () => {
    const decoded = roundTrip([{ lat: 0, lon: 0 }]);

    expect(decoded[0]).toEqual({ lat: 0, lon: 0 });
  });

  it("does not drift over a long track", () => {
    // Rounding each point before differencing keeps error from accumulating.
    const points: LatLon[] = Array.from({ length: 2000 }, (_, i) => ({
      lat: 50.45 + i * 0.00013,
      lon: 30.52 + i * 0.00007,
    }));
    const decoded = roundTrip(points);
    const last = decoded[decoded.length - 1];

    expect(decoded).toHaveLength(points.length);
    expect(last.lat).toBeCloseTo(points[points.length - 1].lat, 5);
    expect(last.lon).toBeCloseTo(points[points.length - 1].lon, 5);
  });

  it("stays substantially smaller than the equivalent JSON", () => {
    const points: LatLon[] = Array.from({ length: 1000 }, (_, i) => ({
      lat: 50.45 + i * 0.0001,
      lon: 30.52 + i * 0.0001,
    }));

    const encodedSize = encodePolyline(points).length;
    const jsonSize = JSON.stringify(points).length;

    expect(encodedSize).toBeLessThan(jsonSize / 4);
  });
});
