"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect } from "react";

import { DeliveryTimeline } from "@/components/delivery-timeline";
import { KpiCard } from "@/components/kpi-card";
import { MapView } from "@/components/map-view";
import { ProofUploadForm } from "@/components/proof-upload-form";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { getLatestDriverLocation } from "@/lib/driver-location";
import { formatDate, formatDistanceMeters } from "@/lib/format";
import { translateEventType, translateLabel } from "@/lib/labels";
import { createRealtimeSocket } from "@/lib/socket";
import type { Delivery, DeliveryStatus } from "@/lib/types";

const progression: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  ASSIGNED: ["ACCEPTED"],
  ACCEPTED: ["PICKED_UP"],
  PICKED_UP: ["IN_TRANSIT"],
  IN_TRANSIT: ["NEAR_DESTINATION"],
  NEAR_DESTINATION: ["DELIVERED"],
};

export default function DriverDeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { auth, ready, isAuthorized } = useProtectedRoute("driver");

  const deliveryQuery = useQuery({
    queryKey: ["driver", "delivery", params.id],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<Delivery>(`/deliveries/${params.id}`, { token: auth?.accessToken }),
  });

  const statusMutation = useMutation({
    mutationFn: (status: DeliveryStatus) =>
      apiFetch(`/deliveries/${params.id}/status`, {
        method: "POST",
        token: auth?.accessToken,
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", "delivery", params.id] });
      queryClient.invalidateQueries({ queryKey: ["driver", "deliveries"] });
    },
  });

  const locationMutation = useMutation({
    mutationFn: async () => {
      const driverId = deliveryQuery.data?.driver?.id;

      if (!driverId || !navigator.geolocation) {
        throw new Error("Оноогдсон курьерын профайл эсвэл байршлын боломж олдсонгүй.");
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const result = await apiFetch(`/drivers/${driverId}/location`, {
                method: "POST",
                token: auth?.accessToken,
                body: JSON.stringify({
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                }),
              });
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          reject,
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", "delivery", params.id] });
      queryClient.invalidateQueries({ queryKey: ["driver", "deliveries"] });
    },
  });

  useEffect(() => {
    if (!auth?.user.tenantId || !deliveryQuery.data?.id) {
      return;
    }

    let socket: Awaited<ReturnType<typeof createRealtimeSocket>> | null = null;

    void createRealtimeSocket({
      accessToken: auth.accessToken,
      tenantId: auth.user.tenantId,
      deliveryId: deliveryQuery.data.id,
      driverId: deliveryQuery.data.driver?.id ?? undefined,
    }).then((createdSocket) => {
      socket = createdSocket;
      socket.on("delivery:status_updated", () =>
        queryClient.invalidateQueries({ queryKey: ["driver", "delivery", params.id] }),
      );
      socket.on("driver:location_updated", () =>
        queryClient.invalidateQueries({ queryKey: ["driver", "delivery", params.id] }),
      );
    });

    return () => {
      socket?.disconnect();
    };
  }, [auth?.accessToken, auth?.user.tenantId, deliveryQuery.data?.driver?.id, deliveryQuery.data?.id, params.id, queryClient]);

  if (!ready || !isAuthorized) {
    return null;
  }

  const delivery = deliveryQuery.data;

  if (!delivery) {
    return <div className="px-6 py-12 text-sm text-slate-500">Хүргэлтийн мэдээллийг ачаалж байна...</div>;
  }

  const latestLocation = getLatestDriverLocation(delivery.driver);
  const nextStatuses = progression[delivery.status] ?? [];
  const latestEvent =
    delivery.events && delivery.events.length > 0
      ? delivery.events[delivery.events.length - 1]
      : null;
  const routeMarkers = [
    {
      id: "pickup",
      label: "Авах цэг",
      latitude: delivery.pickupLat,
      longitude: delivery.pickupLng,
      color: "#f97316",
    },
    {
      id: "dropoff",
      label: "Хүргэх цэг",
      latitude: delivery.dropoffLat,
      longitude: delivery.dropoffLng,
      color: "#0f172a",
    },
    ...(latestLocation
      ? [
          {
            id: "driver",
            label: "Миний шууд байршил",
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            color: "#16a34a",
          },
        ]
      : []),
  ];
  const drivingWaypoints = latestLocation
    ? [routeMarkers[2], routeMarkers[0], routeMarkers[1]]
    : [routeMarkers[0], routeMarkers[1]];

  return (
    <SectionShell
      eyebrow="Курьерын дэлгэрэнгүй"
      title={delivery.trackingCode}
      description="Зөвшөөрөгдсөн төлөвийн дарааллаар ажлаа ахиулж, баталгаа оруулж, шууд байршлаа тогтмол илгээнэ."
    >
      {statusMutation.error instanceof Error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {statusMutation.error.message}
        </div>
      ) : null}
      {locationMutation.error instanceof Error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {locationMutation.error.message}
        </div>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Одоогийн төлөв" value={translateLabel(delivery.status)} hint="Энэ хүргэлтийн одоогийн ажлын шат" />
        <KpiCard
          label="Авах цэг хүртэл"
          value={formatDistanceMeters(delivery.spatial?.distanceToPickupMeters ?? null)}
          hint="Таны шууд байршлаас авах цэг хүртэлх зай"
        />
        <KpiCard
          label="Хүргэх цэг хүртэл"
          value={formatDistanceMeters(delivery.spatial?.distanceToDropoffMeters ?? null)}
          hint="Таны шууд байршлаас хүргэх цэг хүртэлх зай"
        />
        <KpiCard
          label="Сүүлийн байршил"
          value={latestLocation ? formatDate(latestLocation.recordedAt) : "Хуваалцаагүй"}
          hint="Энэ төхөөрөмжөөс бүртгэгдсэн хамгийн сүүлийн байршлын шинэчлэл"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Даалгаврын удирдлага
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <StatusBadge status={delivery.status} />
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    {nextStatuses.length > 0 ? `${nextStatuses.length} дараагийн үйлдэл` : "Сүүлийн шат"}
                  </div>
                </div>
                <div className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  {latestEvent?.message ?? "Байршлаа шинэ байлгаж, дараагийн зөвшөөрөгдсөн шатыг гүйцээж, бараа хүрмэгц баталгаагаа оруулна уу."}
                </div>
              </div>
              <button
                onClick={() => locationMutation.mutate()}
                className="secondary-button"
                disabled={locationMutation.isPending}
              >
                {locationMutation.isPending ? "Илгээж байна..." : "Шууд байршил илгээх"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Авах цэг</div>
                <div className="mt-2 text-sm leading-7 text-slate-700">{delivery.pickupAddress}</div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Хүргэх цэг</div>
                <div className="mt-2 text-sm leading-7 text-slate-700">{delivery.dropoffAddress}</div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Хүрэх хугацаа</div>
                <div className="mt-2 text-sm text-slate-700">{formatDate(delivery.eta ?? null)}</div>
              </div>
              <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-4">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Сүүлийн үйл явдал</div>
                <div className="mt-2 text-sm text-slate-700">{latestEvent ? translateEventType(latestEvent.eventType) : "Одоогоор үйл явдал алга"}</div>
              </div>
              {delivery.notes ? (
                <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/80 px-4 py-4 md:col-span-2">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Тэмдэглэл</div>
                  <div className="mt-2 text-sm leading-7 text-slate-700">{delivery.notes}</div>
                </div>
              ) : null}
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Дараагийн боломжит алхмууд</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {nextStatuses.length > 0 ? (
                  nextStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => statusMutation.mutate(status)}
                      className="primary-button"
                      disabled={statusMutation.isPending}
                    >
                      {statusMutation.isPending ? "Шинэчилж байна..." : translateLabel(status)}
                    </button>
                  ))
                ) : (
                  <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-500">
                    Энэ шатнаас цааш төлөв өөрчлөх боломжгүй.
                  </div>
                )}
              </div>
            </div>
          </div>

          <MapView
            title="Маршрутын тойм"
            markers={routeMarkers}
            route={{
              profile: "driving",
              waypoints: drivingWaypoints,
              lineColor: "#2563eb",
              summaryTitle: "Хамгийн хурдан машины зам",
            }}
          />
          <DeliveryTimeline events={delivery.events ?? []} />
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-5">
            <div className="text-lg font-semibold">Шууд заавар</div>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Курьераас авах цэг хүртэл</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {formatDistanceMeters(delivery.spatial?.distanceToPickupMeters ?? null)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Курьераас хүргэх цэг хүртэл</div>
                <div className="mt-2 text-base font-semibold text-slate-900">
                  {formatDistanceMeters(delivery.spatial?.distanceToDropoffMeters ?? null)}
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Байршлын төлөв</div>
                <div className="mt-2">
                  {latestLocation
                    ? `${latestLocation.latitude.toFixed(5)}, ${latestLocation.longitude.toFixed(5)}`
                    : "Шууд байршил хараахан илгээгээгүй"}
                </div>
              </div>
              <div className="rounded-2xl bg-white/80 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Үйл ажиллагааны хугацаанууд</div>
                <div className="mt-2">Оноогдсон: {formatDate(delivery.assignedAt ?? null)}</div>
                <div className="mt-2">Хүлээн авсан: {formatDate(delivery.acceptedAt ?? null)}</div>
                <div className="mt-2">Бараа авсан: {formatDate(delivery.pickedUpAt ?? null)}</div>
              </div>
            </div>
          </div>

          <ProofUploadForm
            deliveryId={delivery.id}
            token={auth?.accessToken ?? ""}
            onUploaded={() => queryClient.invalidateQueries({ queryKey: ["driver", "delivery", params.id] })}
          />
        </div>
      </div>
    </SectionShell>
  );
}
