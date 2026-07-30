"use client";

import { useEffect, useRef } from "react";
// maplibre-gl v6 is ESM-only with named exports; there is no default export.
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { boundsOf, type GeoFix } from "../geo";

/**
 * Free vector tiles, no API key and no usage limits.
 *
 * OpenFreeMap serves the OpenStreetMap-derived Liberty style; there is no token
 * to leak in the client bundle and no billing to enable, which is why this was
 * chosen over Mapbox or Google.
 */
const TILE_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export interface RiderMarker {
  id: string;
  lat: number;
  lon: number;
  label: string;
  /** Rendered under the label when present. */
  sublabel?: string;
  /** Distinguishes "me" from the rest of the group. */
  isSelf?: boolean;
}

interface Props {
  /** Route to draw as a line. Omit for a live-position-only map. */
  track?: readonly GeoFix[];
  markers?: readonly RiderMarker[];
  /** Recentres the map as the ride progresses. */
  followMarkerId?: string | null;
  className?: string;
}

const ROUTE_SOURCE = "route";
const ROUTE_LAYER = "route-line";

export default function RouteMap({ track, markers, followMarkerId, className }: Props) {
  const container = useRef<HTMLDivElement | null>(null);
  const map = useRef<MapLibreMap | null>(null);
  const markerRefs = useRef(new Map<string, maplibregl.Marker>());
  const hasFitted = useRef(false);

  // ── Create the map once ────────────────────────────────────────────────
  useEffect(() => {
    if (!container.current || map.current) return;

    const instance = new maplibregl.Map({
      container: container.current,
      style: TILE_STYLE,
      center: [30.5234, 50.4501],
      zoom: 11,
      // Riders read this with gloves on at a standstill; rotation just gets in
      // the way and pitch makes the route harder to follow.
      pitchWithRotate: false,
      dragRotate: false,
      attributionControl: { compact: true },
    });

    instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.current = instance;

    return () => {
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current.clear();
      instance.remove();
      map.current = null;
      hasFitted.current = false;
    };
  }, []);

  // ── Route line ─────────────────────────────────────────────────────────
  useEffect(() => {
    const instance = map.current;
    if (!instance || !track || track.length < 2) return;

    const coordinates = track.map((f) => [f.lon, f.lat] as [number, number]);
    const geojson: GeoJSON.Feature<GeoJSON.LineString> = {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates },
    };

    const draw = () => {
      const existing = instance.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
      if (existing) {
        existing.setData(geojson);
      } else {
        instance.addSource(ROUTE_SOURCE, { type: "geojson", data: geojson });
        instance.addLayer({
          id: ROUTE_LAYER,
          type: "line",
          source: ROUTE_SOURCE,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": "#f97316", "line-width": 4, "line-opacity": 0.9 },
        });
      }

      // Fit once, so the map does not yank itself back while the rider pans.
      if (!hasFitted.current) {
        const bounds = boundsOf(track);
        if (bounds) {
          instance.fitBounds(
            [
              [bounds.minLon, bounds.minLat],
              [bounds.maxLon, bounds.maxLat],
            ],
            { padding: 48, duration: 0, maxZoom: 16 },
          );
          hasFitted.current = true;
        }
      }
    };

    // The style loads asynchronously; adding a layer before it is ready throws.
    if (instance.isStyleLoaded()) draw();
    else instance.once("load", draw);
  }, [track]);

  // ── Rider markers ──────────────────────────────────────────────────────
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const seen = new Set<string>();

    for (const rider of markers ?? []) {
      seen.add(rider.id);

      let marker = markerRefs.current.get(rider.id);
      if (!marker) {
        marker = new maplibregl.Marker({ element: buildMarkerElement(rider) });
        marker.setLngLat([rider.lon, rider.lat]).addTo(instance);
        markerRefs.current.set(rider.id, marker);
      } else {
        marker.setLngLat([rider.lon, rider.lat]);
        updateMarkerElement(marker.getElement(), rider);
      }
    }

    // Drop markers for riders who left the group.
    markerRefs.current.forEach((marker, id) => {
      if (!seen.has(id)) {
        marker.remove();
        markerRefs.current.delete(id);
      }
    });
  }, [markers]);

  // ── Follow a rider ─────────────────────────────────────────────────────
  useEffect(() => {
    const instance = map.current;
    if (!instance || !followMarkerId) return;

    const target = markers?.find((m) => m.id === followMarkerId);
    if (target) instance.easeTo({ center: [target.lon, target.lat], duration: 600 });
  }, [markers, followMarkerId]);

  return <div ref={container} className={className ?? "h-full w-full rounded-2xl overflow-hidden"} />;
}

function buildMarkerElement(rider: RiderMarker): HTMLElement {
  const el = document.createElement("div");
  el.className = "flex flex-col items-center gap-1 select-none";

  const dot = document.createElement("div");
  dot.dataset.role = "dot";
  const badge = document.createElement("div");
  badge.dataset.role = "badge";

  el.append(dot, badge);
  updateMarkerElement(el, rider);
  return el;
}

function updateMarkerElement(el: HTMLElement, rider: RiderMarker): void {
  const dot = el.querySelector<HTMLElement>('[data-role="dot"]');
  const badge = el.querySelector<HTMLElement>('[data-role="badge"]');
  if (!dot || !badge) return;

  dot.className = `w-4 h-4 rounded-full border-2 border-white shadow-lg ${
    rider.isSelf ? "bg-orange-500" : "bg-blue-500"
  }`;

  badge.className =
    "px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold whitespace-nowrap leading-tight text-center";
  badge.textContent = rider.label;

  if (rider.sublabel) {
    const sub = document.createElement("span");
    sub.className = "block font-normal opacity-80";
    sub.textContent = rider.sublabel;
    badge.appendChild(sub);
  }
}
