"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { KpiCard } from "@/components/kpi-card";
import { MapView } from "@/components/map-view";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { getLatestDriverLocation } from "@/lib/driver-location";
import { formatDate, formatDistanceMeters } from "@/lib/format";
import { translateLabel } from "@/lib/labels";
import { createRealtimeSocket } from "@/lib/socket";
import type { Driver } from "@/lib/types";

const radiusPresets = [1000, 3000, 5000, 10000];

export default function DriverLiveMapPage() {
  const queryClient = useQueryClient();
  const { auth, ready, isAuthorized } = useProtectedRoute("admin");
  const [draftFilter, setDraftFilter] = useState({
    latitude: "",
    longitude: "",
    radiusMeters: "5000",
  });
  const [appliedFilter, setAppliedFilter] = useState<{
    latitude: number;
    longitude: number;
    radiusMeters?: number;
  } | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

  const driversQuery = useQuery({
    queryKey: ["drivers", "live-map", appliedFilter],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => {
      const searchParams = new URLSearchParams();

      if (appliedFilter) {
        searchParams.set("latitude", String(appliedFilter.latitude));
        searchParams.set("longitude", String(appliedFilter.longitude));

        if (appliedFilter.radiusMeters != null) {
          searchParams.set("radiusMeters", String(appliedFilter.radiusMeters));
        }
      }

      const queryString = searchParams.toString();

      return apiFetch<Driver[]>(
        queryString ? `/deliveries/live-map/drivers?${queryString}` : "/deliveries/live-map/drivers",
        { token: auth?.accessToken },
      );
    },
  });

  useEffect(() => {
    if (!auth?.user.tenantId) {
      return;
    }

    let socket: Awaited<ReturnType<typeof createRealtimeSocket>> | null = null;

    void createRealtimeSocket({
      accessToken: auth.accessToken,
      tenantId: auth.user.tenantId,
    }).then((createdSocket) => {
      socket = createdSocket;
      socket.on("driver:location_updated", () => {
        queryClient.invalidateQueries({ queryKey: ["drivers", "live-map"] });
      });
    });

    return () => {
      socket?.disconnect();
    };
  }, [auth?.accessToken, auth?.user.tenantId, queryClient]);

  if (!ready || !isAuthorized) {
    return null;
  }

  const drivers = driversQuery.data ?? [];
  const visibleDrivers = drivers
    .map((driver) => {
      const latestLocation = getLatestDriverLocation(driver);

      if (!latestLocation) {
        return null;
      }

      return {
        ...driver,
        latestLocation,
      };
    })
    .filter((driver): driver is NonNullable<typeof driver> => driver !== null);

  const selectedDriver =
    visibleDrivers.find((driver) => driver.id === selectedDriverId) ?? visibleDrivers[0] ?? null;
  const activeAssignments = drivers.reduce(
    (sum, driver) => sum + (driver.deliveries?.length ?? 0),
    0,
  );
  const onlineDrivers = drivers.filter((driver) => driver.status !== "OFFLINE").length;
  const busyDrivers = drivers.filter((driver) => driver.status === "BUSY").length;
  const nearestDistance =
    visibleDrivers.find((driver) => driver.distanceMeters != null)?.distanceMeters ?? null;

  const applyFilter = () => {
    const hasCoordinateInput = draftFilter.latitude.trim() || draftFilter.longitude.trim();

    if (!hasCoordinateInput) {
      setAppliedFilter(null);
      setFilterError(null);
      return;
    }

    const latitude = Number(draftFilter.latitude);
    const longitude = Number(draftFilter.longitude);
    const radiusMeters = draftFilter.radiusMeters.trim()
      ? Number(draftFilter.radiusMeters)
      : undefined;

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      setFilterError("Өргөрөг болон уртраг хоёулаа зөв тоо байх ёстой.");
      return;
    }

    if (radiusMeters != null && (!Number.isFinite(radiusMeters) || radiusMeters <= 0)) {
      setFilterError("Радиус эерэг тоо байх ёстой.");
      return;
    }

    setAppliedFilter({ latitude, longitude, radiusMeters });
    setFilterError(null);
    setLocationHint(
      radiusMeters != null
        ? `Байршлын шүүлт нь ${formatDistanceMeters(radiusMeters)} доторх курьеруудыг шүүж байна.`
        : "Байршлын шүүлт нь бүх курьерийг сонгосон цэгээсх зайгаар эрэмбэлж байна.",
    );
  };

  const clearFilter = () => {
    setDraftFilter({
      latitude: "",
      longitude: "",
      radiusMeters: "5000",
    });
    setAppliedFilter(null);
    setFilterError(null);
    setLocationHint("Бүх курьерын жагсаалтыг дахин харуулж байна.");
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFilterError("Энэ браузерт байршлын API байхгүй байна.");
      return;
    }

    setLocationHint("Таны одоогийн браузерын байршлыг авч байна...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDraftFilter((current) => ({
          ...current,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setFilterError(null);
        setLocationHint("Одоогийн байршлыг уншлаа. Ойр курьеруудыг шүүхийн тулд шүүлтээ хэрэгжүүлнэ үү.");
      },
      () => {
        setFilterError("Байршлын хандалт цуцлагдсан эсвэл хугацаа хэтэрсэн.");
        setLocationHint(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };

  return (
    <SectionShell
      eyebrow="Курьерын шууд газрын зураг"
      title="Курьеруудын шууд байршил"
      description="Одоогийн хүргэлтийн хариуцлагатай нь хамт флотын байршлыг бодит хугацаанд харуулна."
      actions={
        <div className="glass-panel rounded-full px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 align-middle animate-pulse" />
          {driversQuery.isFetching ? "Шинэчилж байна" : "Шууд урсгал идэвхтэй"}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Харагдаж буй курьер" value={visibleDrivers.length} hint="Одоогоор газрын зураг дээр гарч буй курьерууд" />
        <KpiCard label="Онлайн" value={onlineDrivers} hint="Идэвхтэй холболттой бэлэн эсвэл ажилтай курьерууд" />
        <KpiCard label="Ажилтай" value={busyDrivers} hint="Одоогоор ажлаа хийж буй курьерууд" />
        <KpiCard
          label="Хамгийн ойр"
          value={nearestDistance != null ? formatDistanceMeters(nearestDistance) : "Мэдээлэл алга"}
          hint="Одоогийн шүүлтийн цэгт хамгийн ойр харагдаж буй курьер"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Байршлын шүүлт
                </div>
                <div className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  Дурын цэгийг төв болгон PostGIS зайгаар шүүж, ойрын курьерууд болон идэвхтэй ажлуудыг нэг дэлгэцээс шалгана.
                </div>
              </div>
              <button onClick={useCurrentLocation} className="secondary-button">
                Миний байршлыг ашиглах
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_0.8fr_auto]">
              <input
                className="input-field"
                placeholder="Өргөрөг"
                value={draftFilter.latitude}
                onChange={(event) =>
                  setDraftFilter((current) => ({ ...current, latitude: event.target.value }))
                }
              />
              <input
                className="input-field"
                placeholder="Уртраг"
                value={draftFilter.longitude}
                onChange={(event) =>
                  setDraftFilter((current) => ({ ...current, longitude: event.target.value }))
                }
              />
              <input
                className="input-field"
                placeholder="Радиус (метр)"
                value={draftFilter.radiusMeters}
                onChange={(event) =>
                  setDraftFilter((current) => ({ ...current, radiusMeters: event.target.value }))
                }
              />
              <div className="flex gap-3">
                <button onClick={applyFilter} className="primary-button flex-1">
                  Хэрэгжүүлэх
                </button>
                <button onClick={clearFilter} className="secondary-button flex-1">
                  Цэвэрлэх
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {radiusPresets.map((preset) => (
                <button
                  key={preset}
                  onClick={() =>
                    setDraftFilter((current) => ({
                      ...current,
                      radiusMeters: String(preset),
                    }))
                  }
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-orange-300 hover:text-orange-700"
                >
                  {formatDistanceMeters(preset)}
                </button>
              ))}
              <button
                onClick={() =>
                  setDraftFilter((current) => ({
                    ...current,
                    radiusMeters: "",
                  }))
                }
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600 transition hover:border-orange-300 hover:text-orange-700"
              >
                Зөвхөн эрэмбэлэх
              </button>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-600">
              {appliedFilter
                ? appliedFilter.radiusMeters != null
                  ? `${appliedFilter.latitude}, ${appliedFilter.longitude} цэгийн ${formatDistanceMeters(appliedFilter.radiusMeters)} доторх курьеруудыг харуулж байна.`
                  : `${appliedFilter.latitude}, ${appliedFilter.longitude} цэгээсх зайгаар эрэмбэлсэн курьеруудыг харуулж байна.`
                : "Бүх курьерийг харуулж байна. PostGIS зайгаар шүүхийн тулд төв цэг болон радиус оруулна уу."}
            </div>

            {locationHint ? (
              <div className="mt-3 text-sm text-slate-500">{locationHint}</div>
            ) : null}
            {filterError ? <div className="mt-2 text-sm text-red-600">{filterError}</div> : null}
          </div>

          <MapView
            title="Флотын хяналтын зураг"
            heightClassName="h-[620px]"
            markers={visibleDrivers.map((driver) => ({
              id: driver.id,
              label:
                driver.distanceMeters != null
                  ? `${driver.name} (${translateLabel(driver.status)}) • ${formatDistanceMeters(driver.distanceMeters)}`
                  : `${driver.name} (${translateLabel(driver.status)})`,
              latitude: driver.latestLocation.latitude,
              longitude: driver.latestLocation.longitude,
              color:
                driver.status === "OFFLINE"
                  ? "#94a3b8"
                  : driver.status === "BUSY"
                    ? "#f97316"
                    : "#16a34a",
            }))}
          />
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Флотын төлөв
                </div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{activeAssignments}</div>
                <div className="mt-1 text-sm text-slate-500">
                  Одоогийн шууд газрын зургийн хариунд багтсан идэвхтэй оноолтууд.
                </div>
              </div>
              {selectedDriver ? <StatusBadge status={selectedDriver.status} /> : null}
            </div>

            {selectedDriver ? (
              <div className="mt-5 rounded-[1.75rem] border border-slate-200/80 bg-white/80 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold text-slate-900">{selectedDriver.name}</div>
                    <div className="mt-1 text-sm text-slate-500">{selectedDriver.phone}</div>
                  </div>
                  {selectedDriver.distanceMeters != null ? (
                    <div className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-orange-700">
                      {formatDistanceMeters(selectedDriver.distanceMeters)}
                    </div>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-3 text-sm text-slate-600">
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    Координат: {selectedDriver.latestLocation.latitude.toFixed(5)}, {selectedDriver.latestLocation.longitude.toFixed(5)}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    Сүүлийн шинэчлэл: {formatDate(selectedDriver.latestLocation.recordedAt)}
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    Идэвхтэй хүргэлт: {selectedDriver.deliveries?.length ?? 0}
                  </div>
                </div>
                {(selectedDriver.deliveries?.length ?? 0) > 0 ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedDriver.deliveries?.map((delivery) => (
                      <div
                        key={delivery.id}
                        className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold tracking-[0.16em] text-slate-600"
                      >
                        {delivery.trackingCode} • {translateLabel(delivery.status)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-sm text-slate-500">
                    Энэ курьер одоогийн хариунд идэвхтэй хүргэлтгүй байна.
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-5 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Одоогийн харагдацад шууд байршилтай курьер алга байна.
              </div>
            )}
          </div>

          <div className="glass-panel rounded-[2rem] p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                Харагдаж буй курьерууд
              </div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                {visibleDrivers.length} харагдаж байна
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {visibleDrivers.length > 0 ? (
                visibleDrivers.map((driver) => (
                  <button
                    key={driver.id}
                    onClick={() => setSelectedDriverId(driver.id)}
                    className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                      selectedDriver?.id === driver.id
                        ? "border-orange-300 bg-orange-50/70 shadow-[0_14px_30px_rgba(249,115,22,0.12)]"
                        : "border-slate-200 bg-white/80 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-slate-900">{driver.name}</div>
                        <div className="mt-1 text-sm text-slate-500">
                          {driver.latestLocation.latitude.toFixed(4)}, {driver.latestLocation.longitude.toFixed(4)}
                        </div>
                      </div>
                      <StatusBadge status={driver.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span>{formatDate(driver.latestLocation.recordedAt)}</span>
                      <span>
                        {driver.distanceMeters != null
                          ? formatDistanceMeters(driver.distanceMeters)
                          : `${driver.deliveries?.length ?? 0} идэвхтэй`}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Одоогийн шүүлтэд тохирох курьер олдсонгүй. Радиусаа томруулах эсвэл шүүлтээ цэвэрлээд үзнэ үү.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
