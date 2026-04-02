"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { FilterTable } from "@/components/filter-table";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { Delivery } from "@/lib/types";

export default function DeliveriesListPage() {
  const { auth, ready, isAuthorized } = useProtectedRoute("admin");

  const deliveriesQuery = useQuery({
    queryKey: ["deliveries"],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<Delivery[]>("/deliveries", { token: auth?.accessToken }),
  });

  if (!ready || !isAuthorized) {
    return null;
  }

  return (
    <SectionShell
      eyebrow="Хүргэлтүүд"
      title="Хүргэлтийн жагсаалт"
      description="Шууд төлөв, хүрэх хугацаатай хүргэлтийн бүртгэлүүдийг хайж, шүүж, нээнэ."
      actions={
        <Link href="/admin/deliveries/new" className="primary-button">
          Шинэ хүргэлт
        </Link>
      }
    >
      <FilterTable
        rows={deliveriesQuery.data ?? []}
        getSearchText={(delivery) =>
          `${delivery.trackingCode} ${delivery.pickupAddress} ${delivery.dropoffAddress} ${delivery.status}`
        }
        emptyMessage="Хайлтад тохирох хүргэлт олдсонгүй."
        renderRow={(delivery) => (
          <Link
            href={`/admin/deliveries/${delivery.id}`}
            key={delivery.id}
            className="block rounded-[1.5rem] border border-slate-900/8 bg-white/80 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{delivery.trackingCode}</div>
                <div className="mt-2 text-sm text-slate-600">{delivery.pickupAddress}</div>
                <div className="text-sm text-slate-600">{delivery.dropoffAddress}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={delivery.status} />
                <div className="text-xs font-mono text-slate-400">{formatDate(delivery.updatedAt)}</div>
              </div>
            </div>
          </Link>
        )}
      />
    </SectionShell>
  );
}
