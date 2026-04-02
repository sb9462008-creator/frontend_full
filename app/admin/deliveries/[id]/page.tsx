"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DeliveryTimeline } from "@/components/delivery-timeline";
import { DriverAssignmentModal } from "@/components/driver-assignment-modal";
import { MapView } from "@/components/map-view";
import { ProofUploadForm } from "@/components/proof-upload-form";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { getLatestDriverLocation } from "@/lib/driver-location";
import { formatDate, formatDistanceMeters } from "@/lib/format";
import { translateLabel } from "@/lib/labels";
import { createRealtimeSocket } from "@/lib/socket";
import type { Delivery, DeliveryStatus } from "@/lib/types";

const nextStatusOptions: Partial<Record<DeliveryStatus, DeliveryStatus[]>> = {
  PENDING: ["ASSIGNED", "FAILED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "FAILED", "CANCELLED"],
  ACCEPTED: ["PICKED_UP", "FAILED", "RETURNED"],
  PICKED_UP: ["IN_TRANSIT", "FAILED", "RETURNED"],
  IN_TRANSIT: ["NEAR_DESTINATION", "FAILED", "RETURNED"],
  NEAR_DESTINATION: ["DELIVERED", "FAILED", "RETURNED"],
};

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { auth, ready, isAuthorized } = useProtectedRoute("admin");
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  const deliveryQuery = useQuery({
    queryKey: ["delivery", params.id],
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
      queryClient.invalidateQueries({ queryKey: ["delivery", params.id] });
    },
  });

  useEffect(() => {
    if (!auth?.user.tenantId || !deliveryQuery.data?.id) {
      return;
    }

    let socket: Awaited<ReturnType<typeof createRealtimeSocket>> | null = null;

    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ["delivery", params.id] });
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
    };

    void createRealtimeSocket({
      accessToken: auth.accessToken,
      tenantId: auth.user.tenantId,
      deliveryId: deliveryQuery.data.id,
      driverId: deliveryQuery.data.driver?.id ?? undefined,
    }).then((createdSocket) => {
      socket = createdSocket;
      socket.on("delivery:status_updated", refresh);
      socket.on("delivery:assigned", refresh);
      socket.on("delivery:eta_updated", refresh);
      socket.on("driver:location_updated", refresh);
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
  const markers = [
    {
      id: `${delivery.id}-pickup`,
      label: "Авах цэг",
      latitude: delivery.pickupLat,
      longitude: delivery.pickupLng,
      color: "#f97316",
    },
    {
      id: `${delivery.id}-dropoff`,
      label: "Хүргэх цэг",
      latitude: delivery.dropoffLat,
      longitude: delivery.dropoffLng,
      color: "#0f172a",
    },
    ...(latestLocation
        ? [
          {
            id: `${delivery.id}-driver`,
            label: delivery.driver?.name ?? "Курьер",
            latitude: latestLocation.latitude,
            longitude: latestLocation.longitude,
            color: "#16a34a",
          },
        ]
      : []),
  ];
  const drivingWaypoints = latestLocation
    ? [markers[2], markers[0], markers[1]]
    : [markers[0], markers[1]];

  return (
    <>
      <SectionShell
        eyebrow="Хүргэлтийн дэлгэрэнгүй"
        title={delivery.trackingCode}
        description="Маршрут, оноолт, хүргэлтийн баталгаа болон шууд үйл явдлын түүхийг шалгана."
        actions={
          <div className="flex gap-3">
            <button onClick={() => setIsAssignOpen(true)} className="secondary-button">
              Курьер оноох
            </button>
            <Link href="/admin/deliveries" className="secondary-button">
              Буцах
            </Link>
          </div>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <MapView
              title="Маршрут ба курьерын шууд байршил"
              markers={markers}
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
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Төлөв</div>
                <StatusBadge status={delivery.status} />
              </div>
              <div className="mt-4 text-sm text-slate-600">
                <div>Авах цэг: {delivery.pickupAddress}</div>
                <div className="mt-2">Хүргэх цэг: {delivery.dropoffAddress}</div>
                <div className="mt-2">Хүрэх хугацаа: {formatDate(delivery.eta ?? null)}</div>
                <div className="mt-2">Курьер: {delivery.driver?.name ?? "Оноогоогүй"}</div>
                <div className="mt-2">
                  Курьераас авах цэг хүртэл: {formatDistanceMeters(delivery.spatial?.distanceToPickupMeters ?? null)}
                </div>
                <div className="mt-2">
                  Курьераас хүргэх цэг хүртэл: {formatDistanceMeters(delivery.spatial?.distanceToDropoffMeters ?? null)}
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {(nextStatusOptions[delivery.status] ?? []).map((status) => (
                  <button
                    key={status}
                    className="secondary-button"
                    onClick={() => statusMutation.mutate(status)}
                  >
                    {translateLabel(status)} болгох
                  </button>
                ))}
              </div>
            </div>

            <ProofUploadForm
              deliveryId={delivery.id}
              token={auth?.accessToken ?? ""}
              onUploaded={() => queryClient.invalidateQueries({ queryKey: ["delivery", params.id] })}
            />
          </div>
        </div>
      </SectionShell>

      <DriverAssignmentModal
        open={isAssignOpen}
        deliveryId={delivery.id}
        token={auth?.accessToken ?? ""}
        onClose={() => setIsAssignOpen(false)}
        onAssigned={() => queryClient.invalidateQueries({ queryKey: ["delivery", params.id] })}
      />
    </>
  );
}
