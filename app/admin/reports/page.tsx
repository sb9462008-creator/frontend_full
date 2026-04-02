"use client";

import { useQuery } from "@tanstack/react-query";

import { FilterTable } from "@/components/filter-table";
import { KpiCard } from "@/components/kpi-card";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { translateLabel } from "@/lib/labels";
import type { Delivery, Driver } from "@/lib/types";

type DeliveriesReport = {
  deliveriesByStatus: { status: string; count: number }[];
  recentDeliveries: Delivery[];
};

export default function ReportsPage() {
  const { auth, ready, isAuthorized } = useProtectedRoute("admin");

  const deliveriesReportQuery = useQuery({
    queryKey: ["reports", "deliveries"],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<DeliveriesReport>("/reports/deliveries", { token: auth?.accessToken }),
  });

  const driversReportQuery = useQuery({
    queryKey: ["reports", "drivers"],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<Driver[]>("/reports/drivers", { token: auth?.accessToken }),
  });

  if (!ready || !isAuthorized) {
    return null;
  }

  return (
    <SectionShell
      eyebrow="Тайлан"
      title="Ажиллагааны аналитик"
      description="Төлөвийн тархалт болон курьерын ачааллын зураглалаар үйлчилгээний гүйцэтгэлийг үнэлнэ."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {(deliveriesReportQuery.data?.deliveriesByStatus ?? []).slice(0, 4).map((item) => (
          <KpiCard
            key={item.status}
            label={translateLabel(item.status)}
            value={item.count}
            hint="Энэ төлөвт буй хүргэлтийн тоо"
          />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <FilterTable
          rows={deliveriesReportQuery.data?.recentDeliveries ?? []}
          getSearchText={(delivery) => `${delivery.trackingCode} ${delivery.status}`}
          emptyMessage="Тайланд харагдах хүргэлт алга."
          renderRow={(delivery) => (
            <div key={delivery.id} className="rounded-[1.5rem] border border-slate-900/8 bg-white/80 p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{delivery.trackingCode}</div>
                <StatusBadge status={delivery.status} />
              </div>
              <div className="mt-2 text-sm text-slate-600">{delivery.pickupAddress}</div>
            </div>
          )}
        />

        <FilterTable
          rows={driversReportQuery.data ?? []}
          getSearchText={(driver) => `${driver.name} ${driver.status}`}
          emptyMessage="Тайланд харагдах курьер алга."
          renderRow={(driver) => (
            <div key={driver.id} className="rounded-[1.5rem] border border-slate-900/8 bg-white/80 p-5">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{driver.name}</div>
                <StatusBadge status={driver.status} />
              </div>
              <div className="mt-2 text-sm text-slate-600">
                Идэвхтэй хүргэлт: {driver.deliveries?.filter((item) => item.status !== "DELIVERED").length ?? 0}
              </div>
            </div>
          )}
        />
      </div>
    </SectionShell>
  );
}
