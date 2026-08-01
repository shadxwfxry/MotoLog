"use client";

import { useEffect, useRef } from "react";
// Pinned to v5: v6 ships as two separate ES modules (`maplibre-gl.mjs` plus
// `maplibre-gl-shared.mjs`) and webpack evaluated the first before the second,
// so the map bundle threw `ReferenceError: _n is not defined` and took the
// whole /rides route down — in production builds only. v5 is a single
// self-contained bundle with a default export and has no such ordering hazard.
import maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { boundsOf, type GeoFix } from "../geo";

/**
 * Free vector tiles, no API key and no usage limits.
 *
 * OpenFreeMap serves OpenStreetMap-derived styles; there is no token to leak in
 * the client bundle and no billing to enable, which is why this was chosen over
 * Mapbox or Google.
 *
 * The style is picked once, at mount, from the theme already on <html>: a
 * bright basemap inside the dark cockpit UI was the single loudest thing on the
 * screen and made the route line hard to follow.
 */
const STYLE_BASE = "https://tiles.openfreemap.org/styles";

function resolveStyle(): string {
  const isDark =
    typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  return `${STYLE_BASE}/${isDark ? "dark" : "positron"}`;
}

/** Accent colour of the route, read from the live theme token. */
function routeColor(): string {
  if (typeof document === "undefined") return "#ff6a1a";
  const primary = getComputedStyle(document.documentElement).getPropertyValue("--primary").trim();
  // MapLibre paints on a canvas, where `var()` never resolves — the value has to
  // be materialised into a concrete colour string here.
  return primary ? `hsl(${primary})` : "#ff6a1a";
}

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
const ROUTE_GLOW_LAYER = "route-glow";

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
      style: resolveStyle(),
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

    // MapLibre measures the container once, at construction. Inside a panel
    // that is still laying out — or on a tab that was hidden when it mounted —
    // it latched onto the wrong size and painted tiles into a fraction of the
    // box, leaving the rest blank. Observing the element keeps the canvas and
    // the panel the same size for the life of the map.
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(container.current);

    return () => {
      observer.disconnect();
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
        const color = routeColor();
        instance.addSource(ROUTE_SOURCE, { type: "geojson", data: geojson });

        // Two passes: a wide, soft pass that reads as a glow around the route,
        // then the crisp line on top. One flat stroke disappeared against busy
        // city tiles.
        instance.addLayer({
          id: ROUTE_GLOW_LAYER,
          type: "line",
          source: ROUTE_SOURCE,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": color, "line-width": 12, "line-opacity": 0.22, "line-blur": 8 },
        });
        instance.addLayer({
          id: ROUTE_LAYER,
          type: "line",
          source: ROUTE_SOURCE,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: { "line-color": color, "line-width": 4 },
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

  // These are DOM overlays, not canvas paint, so Tailwind classes apply — but
  // they live outside React, hence the manual className assignment.
  dot.className = rider.isSelf
    ? "h-4 w-4 rounded-full bg-primary ring-2 ring-primary/40 shadow-[0_0_16px_hsl(var(--primary))]"
    : "h-3.5 w-3.5 rounded-full bg-signal-cyan ring-2 ring-signal-cyan/40 shadow-[0_0_14px_hsl(var(--signal-cyan))]";

  badge.className =
    "glass rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground whitespace-nowrap leading-tight text-center border border-[hsl(var(--hairline))]";
  badge.textContent = rider.label;

  if (rider.sublabel) {
    const sub = document.createElement("span");
    sub.className = "block font-mono font-normal normal-case tracking-normal opacity-70";
    sub.textContent = rider.sublabel;
    badge.appendChild(sub);
  }
}
