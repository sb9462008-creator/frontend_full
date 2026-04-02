"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { FilterTable } from "@/components/filter-table";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { translateLabel } from "@/lib/labels";
import type { Delivery, DeliveryStatus } from "@/lib/types";

const nextStatusByCurrent: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  ASSIGNED: "ACCEPTED",
  ACCEPTED: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "NEAR_DESTINATION",
  NEAR_DESTINATION: "DELIVERED",
};

const quickActionLabels: Partial<Record<DeliveryStatus, string>> = {
  ASSIGNED: "Хүргэлт хүлээн авах",
  ACCEPTED: "Барааг авсан гэж тэмдэглэх",
  PICKED_UP: "Замд гарсан гэж тэмдэглэх",
  IN_TRANSIT: "Очих хаягт ойртсон",
  NEAR_DESTINATION: "Хүргэгдсэн гэж тэмдэглэх",
};

export default function DriverDeliveriesPage() {
  const queryClient = useQueryClient();
  const { auth, ready, isAuthorized } = useProtectedRoute("driver");

  const deliveriesQuery = useQuery({
    queryKey: ["driver", "deliveries"],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<Delivery[]>("/deliveries", { token: auth?.accessToken }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ deliveryId, status }: { deliveryId: string; status: DeliveryStatus }) =>
      apiFetch(`/deliveries/${deliveryId}/status`, {
        method: "POST",
        token: auth?.accessToken,
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver", "deliveries"] });
    },
  });

  if (!ready || !isAuthorized) {
    return null;
  }

  const deliveries = deliveriesQuery.data ?? [];

  return (
    <SectionShell
      eyebrow="Курьерын хүргэлтүүд"
      title="Миний оноогдсон хүргэлтүүд"
      description="Одоогийн даалгавруудаа харж, хүргэлтийн төлөвийг дараагийн шатанд аюулгүй ахиулж, байршлын шинэчлэл илгээнэ."
    >
      {statusMutation.error instanceof Error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {statusMutation.error.message}
        </div>
      ) : null}
      <FilterTable
        rows={deliveries}
        getSearchText={(delivery) => `${delivery.trackingCode} ${delivery.pickupAddress} ${delivery.dropoffAddress}`}
        emptyMessage="Одоогоор оноогдсон хүргэлт алга."
        renderRow={(delivery) => {
          const nextStatus = nextStatusByCurrent[delivery.status];

          return (
            <div
              key={delivery.id}
              className="rounded-[1.5rem] border border-slate-900/8 bg-white/80 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-semibold">{delivery.trackingCode}</div>
                  <div className="mt-2 text-sm text-slate-600">{delivery.pickupAddress}</div>
                  <div className="text-sm text-slate-600">{delivery.dropoffAddress}</div>
                </div>
                <StatusBadge status={delivery.status} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/driver/deliveries/${delivery.id}`} className="secondary-button">
                  Даалгавар нээх
                </Link>
                {nextStatus ? (
                  <button
                    type="button"
                    onClick={() => statusMutation.mutate({ deliveryId: delivery.id, status: nextStatus })}
                    className="primary-button"
                    disabled={statusMutation.isPending}
                  >
                    {statusMutation.isPending
                      ? "Шинэчилж байна..."
                      : quickActionLabels[delivery.status] ?? translateLabel(nextStatus)}
                  </button>
                ) : null}
              </div>
            </div>
          );
        }}
      />
    </SectionShell>
  );
}
