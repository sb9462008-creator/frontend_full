"use client";

import { useEffect, useRef, useState } from "react";

import { formatDistanceMeters, formatDurationSeconds } from "@/lib/format";

import { LiveLocationMarker } from "./live-location-marker";

export type MapMarker = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  color?: string;
};

type RouteLeg = {
  fromLabel: string;
  toLabel: string;
  distanceMeters: number;
  durationSeconds: number;
};

type RouteData = {
  geometryCoordinates: [number, number][];
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  legs: RouteLeg[];
};

type MapRoutePlan = {
  waypoints: MapMarker[];
  profile?: "driving";
  lineColor?: string;
  summaryTitle?: string;
};

type DirectionsResponse = {
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: [number, number][];
    };
    legs?: Array<{
      distance: number;
      duration: number;
    }>;
  }>;
  message?: string;
};

export function MapView({
  title,
  markers,
  heightClassName = "h-[420px]",
  route,
}: {
  title: string;
  markers: MapMarker[];
  heightClassName?: string;
  route?: MapRoutePlan;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const routeWaypoints = route?.waypoints ?? [];
  const routeRequestKey =
    routeWaypoints.length > 1
      ? JSON.stringify({
          profile: route?.profile ?? "driving",
          waypoints: routeWaypoints.map((waypoint) => ({
            label: waypoint.label,
            latitude: waypoint.latitude,
            longitude: waypoint.longitude,
          })),
        })
      : "";

  useEffect(() => {
    if (!routeRequestKey) {
      setRouteData(null);
      setRouteError(null);
      setRouteLoading(false);
      return;
    }

    const abortController = new AbortController();
    const routeRequest = JSON.parse(routeRequestKey) as {
      profile: "driving";
      waypoints: Array<{
        label: string;
        latitude: number;
        longitude: number;
      }>;
    };
    const coordinates = routeRequest.waypoints
      .map((waypoint) => `${waypoint.longitude},${waypoint.latitude}`)
      .join(";");

    setRouteLoading(true);
    setRouteError(null);

    const directionsUrl = token
      ? `https://api.mapbox.com/directions/v5/mapbox/${routeRequest.profile}/${coordinates}?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${token}`
      : `https://router.project-osrm.org/route/v1/driving/${coordinates}?alternatives=false&geometries=geojson&overview=full&steps=false`;

    void fetch(directionsUrl, { signal: abortController.signal })
      .then(async (response) => {
        const data = (await response.json()) as DirectionsResponse;

        if (!response.ok || !data.routes || data.routes.length === 0) {
          throw new Error(data.message ?? "Хамгийн хурдан машины замыг тооцоолж чадсангүй.");
        }

        const fastestRoute = data.routes[0];
        const legs = (fastestRoute.legs ?? []).map((leg, index) => ({
          fromLabel: routeRequest.waypoints[index]?.label ?? `Зогсоол ${index + 1}`,
          toLabel: routeRequest.waypoints[index + 1]?.label ?? `Зогсоол ${index + 2}`,
          distanceMeters: leg.distance,
          durationSeconds: leg.duration,
        }));

        setRouteData({
          geometryCoordinates: fastestRoute.geometry.coordinates,
          totalDistanceMeters: fastestRoute.distance,
          totalDurationSeconds: fastestRoute.duration,
          legs,
        });
      })
      .catch((error: unknown) => {
        if (abortController.signal.aborted) {
          return;
        }

        setRouteData(null);
        setRouteError(error instanceof Error ? error.message : "Машины замыг тооцоолж чадсангүй.");
      })
      .finally(() => {
        if (!abortController.signal.aborted) {
          setRouteLoading(false);
        }
      });

    return () => {
      abortController.abort();
    };
  }, [routeRequestKey, token]);

  useEffect(() => {
    if (!containerRef.current || markers.length === 0) {
      return;
    }

    let isActive = true;
    let cleanup = () => {};

    if (token) {
      void import("mapbox-gl").then((module) => {
        if (!isActive || !containerRef.current) {
          return;
        }

        const mapboxgl = module.default;
        mapboxgl.accessToken = token;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [markers[0].longitude, markers[0].latitude],
          zoom: 10,
        });

        const bounds = new mapboxgl.LngLatBounds();

        markers.forEach((marker) => {
          bounds.extend([marker.longitude, marker.latitude]);

          new mapboxgl.Marker({ color: marker.color ?? "#f97316" })
            .setLngLat([marker.longitude, marker.latitude])
            .setPopup(new mapboxgl.Popup().setHTML(`<strong>${marker.label}</strong>`))
            .addTo(map);
        });

        const addRouteLayer = () => {
          if (!routeData?.geometryCoordinates.length || map.getSource("route-line")) {
            return;
          }

          for (const [longitude, latitude] of routeData.geometryCoordinates) {
            bounds.extend([longitude, latitude]);
          }

          map.addSource("route-line", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: routeData.geometryCoordinates,
              },
            },
          });

          map.addLayer({
            id: "route-line-shadow",
            type: "line",
            source: "route-line",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#ffffff",
              "line-width": 10,
              "line-opacity": 0.9,
            },
          });

          map.addLayer({
            id: "route-line-main",
            type: "line",
            source: "route-line",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": route?.lineColor ?? "#2563eb",
              "line-width": 6,
              "line-opacity": 0.95,
            },
          });
        };

        if (routeData?.geometryCoordinates.length) {
          if (map.isStyleLoaded()) {
            addRouteLayer();
          } else {
            map.on("load", addRouteLayer);
          }
        }

        if (markers.length > 1 || routeData?.geometryCoordinates.length) {
          map.fitBounds(bounds, { padding: 70 });
        }

        cleanup = () => map.remove();
      });
    } else {
      void import("leaflet").then((module) => {
        if (!isActive || !containerRef.current) {
          return;
        }

        const L = module.default;
        const map = L.map(containerRef.current, {
          center: [markers[0].latitude, markers[0].longitude],
          zoom: 10,
          zoomControl: true,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(map);

        const bounds = L.latLngBounds([]);

        markers.forEach((marker) => {
          const latLng: [number, number] = [marker.latitude, marker.longitude];
          bounds.extend(latLng);

          L.circleMarker(latLng, {
            radius: 8,
            color: "#ffffff",
            weight: 2,
            fillColor: marker.color ?? "#f97316",
            fillOpacity: 0.95,
          })
            .bindPopup(`<strong>${marker.label}</strong>`)
            .addTo(map);
        });

        const fallbackCoordinates =
          routeData?.geometryCoordinates.length
            ? routeData.geometryCoordinates
            : routeWaypoints.length > 1
              ? routeWaypoints.map((waypoint) => [waypoint.longitude, waypoint.latitude] as [number, number])
              : [];

        if (fallbackCoordinates.length > 1) {
          const latLngs = fallbackCoordinates.map(([longitude, latitude]) => [latitude, longitude] as [number, number]);
          latLngs.forEach((coordinate) => bounds.extend(coordinate));

          L.polyline(latLngs, {
            color: route?.lineColor ?? "#2563eb",
            weight: 6,
            opacity: 0.9,
          }).addTo(map);
        }

        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50] });
        }

        const invalidate = () => {
          map.invalidateSize();
        };

        requestAnimationFrame(invalidate);
        window.setTimeout(invalidate, 120);

        cleanup = () => map.remove();
      });
    }

    return () => {
      isActive = false;
      cleanup();
    };
  }, [markers, route?.lineColor, routeData, routeWaypoints, token]);

  const estimatedArrival =
    routeData != null
      ? new Intl.DateTimeFormat("mn-MN", { timeStyle: "short" }).format(
          new Date(Date.now() + routeData.totalDurationSeconds * 1000),
        )
      : null;

  return (
    <div className="glass-panel rounded-[2rem] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[var(--text)]">{title}</h3>
        <div className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Газрын зураг</div>
      </div>
      {markers.length === 0 ? (
        <div className={`${heightClassName} rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface-2)] p-6 text-sm text-[var(--muted)]`}>
          Энэ харагдацад газрын зураг дээр харуулах цэг алга.
        </div>
      ) : (
        <div className="space-y-3">
          {route ? (
            <div className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    {route.summaryTitle ?? "Хамгийн хурдан машины зам"}
                  </div>
                  <div className="mt-2 text-base font-semibold text-[var(--text)]">
                    {routeLoading ? "Тооцож байна..." : formatDurationSeconds(routeData?.totalDurationSeconds ?? null)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Замын урт</div>
                  <div className="mt-2 text-base font-semibold text-[var(--text)]">
                    {routeLoading ? "Тооцож байна..." : formatDistanceMeters(routeData?.totalDistanceMeters ?? null)}
                  </div>
                </div>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Одоо хөдөлбөл</div>
                  <div className="mt-2 text-base font-semibold text-[var(--text)]">
                    {routeLoading ? "Тооцож байна..." : estimatedArrival ?? "Мэдээлэл алга"}
                  </div>
                </div>
              </div>
              {routeData?.legs.length ? (
                <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Замын хэсгүүд</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {routeData.legs.map((leg) => (
                      <div key={`${leg.fromLabel}-${leg.toLabel}`} className="rounded-2xl bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm">
                        <div className="font-semibold text-[var(--text)]">
                          {leg.fromLabel} {"->"} {leg.toLabel}
                        </div>
                        <div className="mt-1 text-[var(--muted)]">
                          {formatDurationSeconds(leg.durationSeconds)} • {formatDistanceMeters(leg.distanceMeters)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              {routeError ? (
                <div className="rounded-2xl border border-[rgba(241,193,75,0.34)] bg-[rgba(241,193,75,0.12)] px-4 py-3 text-sm text-[var(--yellow)]">
                  {routeError}
                </div>
              ) : null}
            </div>
          ) : null}
          <div ref={containerRef} className={`${heightClassName} overflow-hidden rounded-[1.5rem]`} />
          {!token ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-xs text-[var(--muted)]">
              `NEXT_PUBLIC_MAPBOX_TOKEN` тохируулаагүй тул газрын зураг OpenStreetMap tile ашиглаж байна.
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-2">
            {markers.map((marker) => (
              <LiveLocationMarker
                key={marker.id}
                label={marker.label}
                latitude={marker.latitude}
                longitude={marker.longitude}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
