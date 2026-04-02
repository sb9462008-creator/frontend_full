"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { FilterTable } from "@/components/filter-table";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { getLatestDriverLocation } from "@/lib/driver-location";
import { translateLabel } from "@/lib/labels";
import type { Driver } from "@/lib/types";

export default function DriversListPage() {
  const { auth, ready, isAuthorized } = useProtectedRoute("admin");

  const driversQuery = useQuery({
    queryKey: ["drivers", auth?.user.tenant.id ?? "admin"],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<Driver[]>("/drivers", { token: auth?.accessToken }),
    refetchOnMount: "always",
    staleTime: 0,
  });

  if (!ready || !isAuthorized) {
    return null;
  }

  return (
    <SectionShell
      eyebrow="Курьерууд"
      title="Курьерын жагсаалт"
      description="Одоогийн боломжит байдал, сүүлийн шууд байршил болон хүргэлтийн ачааллыг шалгана."
      actions={
        <Link href="/admin/drivers/live-map" className="primary-button">
          Шууд газрын зураг нээх
        </Link>
      }
    >
      {driversQuery.isLoading ? (
        <div className="mb-4 rounded-[1.5rem] border border-slate-900/8 bg-white/80 p-5 text-sm text-slate-500">
          Курьеруудын жагсаалтыг ачаалж байна...
        </div>
      ) : null}

      {driversQuery.error instanceof Error ? (
        <div className="mb-4 rounded-[1.5rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          Курьеруудын жагсаалтыг ачаалж чадсангүй. {driversQuery.error.message}
        </div>
      ) : null}

      <FilterTable
        rows={driversQuery.data ?? []}
        getSearchText={(driver) =>
          `${driver.name} ${driver.phone} ${driver.status} ${driver.user?.name ?? ""} ${driver.user?.email ?? ""}`
        }
        emptyMessage="Курьер олдсонгүй."
        renderRow={(driver) => {
          const latestLocation = getLatestDriverLocation(driver);

          return (
            <div key={driver.id} className="rounded-[1.5rem] border border-slate-900/8 bg-white/80 p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{driver.name}</div>
                  <div className="mt-1 text-sm text-slate-600">{driver.phone}</div>
                  <div className="mt-2 text-sm text-slate-600">
                    Холбогдсон хэрэглэгч:
                    {" "}
                    {driver.user ? `${driver.user.name} · ${driver.user.email}` : "Холбогдсон эрхгүй"}
                  </div>
                  <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {driver.user ? `${translateLabel(driver.user.role)} · ${driver.user.isActive ? "Идэвхтэй" : "Идэвхгүй"}` : "Холбогдоогүй"}
                  </div>
                </div>
                <StatusBadge status={driver.status} />
              </div>
              <div className="mt-3 text-sm text-slate-500">
                Сүүлийн байршил:
                {" "}
                {latestLocation
                  ? `${latestLocation.latitude.toFixed(4)}, ${latestLocation.longitude.toFixed(4)}`
                  : "Байршил хараахан алга"}
              </div>
            </div>
          );
        }}
      />
    </SectionShell>
  );
}
