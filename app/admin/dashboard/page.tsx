"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { KpiCard } from "@/components/kpi-card";
import { MapView } from "@/components/map-view";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { DashboardSummary, Delivery } from "@/lib/types";

export default function AdminDashboardPage() {
  const { auth, ready, isAuthorized } = useProtectedRoute("admin");

  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<DashboardSummary>("/dashboard/summary", { token: auth?.accessToken }),
  });

  const deliveriesQuery = useQuery({
    queryKey: ["deliveries", "dashboard"],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<Delivery[]>("/deliveries", { token: auth?.accessToken }),
  });

  if (!ready || !isAuthorized) {
    return null;
  }

  const deliveries = deliveriesQuery.data ?? [];

  return (
    <SectionShell
      eyebrow="Админы самбар"
      title="Шууд ажиллагааны хяналт"
      description="Нэг самбараас хүргэлтийн урсгал, цагтаа хүргэлт, идэвхтэй маршрут, курьерын хөдөлгөөнийг хянана."
      actions={
        <div className="flex gap-3">
          <Link href="/admin/deliveries/new" className="primary-button">
            Хүргэлт үүсгэх
          </Link>
          <Link href="/admin/reports" className="secondary-button">
            Тайлан харах
          </Link>
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Өнөөдөр" value={summaryQuery.data?.totalDeliveriesToday ?? 0} hint="Өнөөдөр үүссэн хүргэлт" />
        <KpiCard label="Идэвхтэй" value={summaryQuery.data?.activeDeliveries ?? 0} hint="Оноогдсон эсвэл явж буй хүргэлт" />
        <KpiCard label="Цагтаа хүргэлт" value={`${summaryQuery.data?.onTimeRate ?? 0}%`} hint="Тооцоолсон хугацаандаа хүргэгдсэн хувь" />
        <KpiCard
          label="Курьерын ачаалал"
          value={`${summaryQuery.data?.driverUtilization ?? 0}%`}
          hint="Идэвхтэй ажилтай курьерууд"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <MapView
          title="Маршрутын самбар"
          markers={deliveries.slice(0, 8).flatMap((delivery) => [
            {
              id: `${delivery.id}-pickup`,
              label: `${delivery.trackingCode} авах цэг`,
              latitude: delivery.pickupLat,
              longitude: delivery.pickupLng,
              color: "#f97316",
            },
            {
              id: `${delivery.id}-dropoff`,
              label: `${delivery.trackingCode} хүргэх цэг`,
              latitude: delivery.dropoffLat,
              longitude: delivery.dropoffLng,
              color: "#0f172a",
            },
          ])}
        />

        <div className="glass-panel rounded-[2rem] p-5">
          <div className="mb-4 text-lg font-semibold">Сүүлийн хүргэлтүүд</div>
          <div className="space-y-3">
            {deliveries.slice(0, 6).map((delivery) => (
              <Link
                href={`/admin/deliveries/${delivery.id}`}
                key={delivery.id}
                className="block rounded-2xl border border-slate-900/8 bg-white/80 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{delivery.trackingCode}</div>
                    <div className="mt-1 text-sm text-slate-500">{delivery.pickupAddress}</div>
                  </div>
                  <StatusBadge status={delivery.status} />
                </div>
                <div className="mt-3 text-xs font-mono text-slate-400">{formatDate(delivery.createdAt)}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
