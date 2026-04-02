"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { DeliveryTimeline } from "@/components/delivery-timeline";
import { KpiCard } from "@/components/kpi-card";
import { MapView } from "@/components/map-view";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { getLatestDriverLocation } from "@/lib/driver-location";
import { formatDate, formatDistanceMeters } from "@/lib/format";
import { translateEventType, translateLabel } from "@/lib/labels";
import { createRealtimeSocket } from "@/lib/socket";
import type { Delivery } from "@/lib/types";

const trackingStages = [
  "PENDING",
  "ASSIGNED",
  "ACCEPTED",
  "PICKED_UP",
  "IN_TRANSIT",
  "NEAR_DESTINATION",
  "DELIVERED",
] as const;

function DeliveryProgressForm({ delivery }: { delivery: Delivery }) {
  const [customerEmail, setCustomerEmail] = useState("");
  const formspreeEndpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
  const progressSummary = `Tracking code: ${delivery.trackingCode}; Status: ${translateLabel(
    delivery.status,
  )}; ETA: ${delivery.eta ? formatDate(delivery.eta) : "Тодорхойгүй"}; Курьер: ${delivery.driver?.name ?? "Оноогоогүй"}.`;

  return (
      <div className="glass-panel rounded-[2rem] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-[var(--text)]">Хүргэлтийн явцын асуулга</div>
            <div className="mt-2 text-sm text-[var(--muted)]">
              Энэ формыг зөвхөн таны хүргэлтийн хяналтын хуудсаас илгээж, таны имэйл рүү холбоо барихад ашиглана.
            </div>
          </div>
      </div>

      <div className="mt-5">
        {formspreeEndpoint ? (
          <form action={formspreeEndpoint} method="POST" className="grid gap-4">
            <input type="hidden" name="_subject" value={`Delivery progress inquiry: ${delivery.trackingCode}`} />
            <input type="hidden" name="trackingCode" value={delivery.trackingCode} />
            <input type="hidden" name="deliveryStatus" value={delivery.status} />
            <input type="hidden" name="deliveryStage" value={translateLabel(delivery.status)} />
            <input type="hidden" name="eta" value={delivery.eta ? formatDate(delivery.eta) : ""} />
            <input type="hidden" name="driverName" value={delivery.driver?.name ?? ""} />
            <input type="hidden" name="pickupAddress" value={delivery.pickupAddress ?? ""} />
            <input type="hidden" name="dropoffAddress" value={delivery.dropoffAddress ?? ""} />
            <input type="hidden" name="progressSummary" value={progressSummary} />
            <input type="hidden" name="email" value={customerEmail} />

            <input className="input-field" type="text" name="name" placeholder="Таны нэр" required />
            <input
              className="input-field"
              type="email"
              name="_replyto"
              value={customerEmail}
              onChange={(event) => setCustomerEmail(event.target.value)}
              placeholder="И-мэйл"
              required
            />
            <textarea
              className="input-field min-h-[140px] resize-none"
              name="message"
              placeholder="Танд ямар нэг асуудал байна уу? Хүргэлтийн явцын талаар дэлгэрэнгүй бичнэ үү."
              required
            />
            <button type="submit" className="primary-button">
              Хүсэлт илгээх
            </button>
          </form>
        ) : (
          <div className="rounded-[1.5rem] border border-[rgba(255,90,95,0.34)] bg-[rgba(255,90,95,0.12)] p-4 text-sm text-[var(--red)]">
            NEXT_PUBLIC_FORMSPREE_ENDPOINT тохируулаагүй байна. .env.local файлыг засаж Formspree endpoint нэмнэ үү.
          </div>
        )}
      </div>
    </div>
  );
}

export default function PublicTrackingDetailPage() {
  const params = useParams<{ trackingCode: string }>();
  const queryClient = useQueryClient();

  const trackingQuery = useQuery({
    queryKey: ["tracking", params.trackingCode],
    queryFn: () => apiFetch<Delivery>(`/deliveries/tracking/${params.trackingCode}`),
  });

  useEffect(() => {
    if (!params.trackingCode) {
      return;
    }

    let socket: Awaited<ReturnType<typeof createRealtimeSocket>> | null = null;

    void createRealtimeSocket({
      trackingCode: params.trackingCode,
    }).then((createdSocket) => {
      socket = createdSocket;
      socket.on("delivery:status_updated", () =>
        queryClient.invalidateQueries({ queryKey: ["tracking", params.trackingCode] }),
      );
      socket.on("delivery:eta_updated", () =>
        queryClient.invalidateQueries({ queryKey: ["tracking", params.trackingCode] }),
      );
      socket.on("delivery:assigned", () =>
        queryClient.invalidateQueries({ queryKey: ["tracking", params.trackingCode] }),
      );
      socket.on("driver:location_updated", () =>
        queryClient.invalidateQueries({ queryKey: ["tracking", params.trackingCode] }),
      );
    });

    return () => {
      socket?.disconnect();
    };
  }, [params.trackingCode, queryClient]);

  const delivery = trackingQuery.data;
  const latestLocation = getLatestDriverLocation(delivery?.driver);
  const latestEvent =
    delivery?.events && delivery.events.length > 0
      ? delivery.events[delivery.events.length - 1]
      : null;
  const currentStageIndex = delivery
    ? trackingStages.indexOf(delivery.status as (typeof trackingStages)[number])
    : -1;

  return (
    <SectionShell
      eyebrow="Tracking"
      title={delivery?.trackingCode ?? params.trackingCode}
      description="Одоогийн хүргэлтийн төлөв, маршрут, сүүлийн курьерын байршил болон хүрэх хугацааг шууд харуулна."
    >
      {!delivery ? (
        <div className="glass-panel rounded-[2rem] p-6 text-sm text-[var(--muted)]">Хяналтын мэдээллийг ачаалж байна...</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Хүрэх хугацаа" value={delivery.eta ? formatDate(delivery.eta) : "Хүлээгдэж байна"} hint="Хэрэглэгчид хүрэх тооцоолсон цаг" />
            <KpiCard label="Курьер" value={delivery.driver?.name ?? "Оноогоогүй"} hint="Одоогоор энэ хүргэлтийг хариуцаж буй курьер" />
            <KpiCard
              label="Хүргэх цэг хүртэл"
              value={formatDistanceMeters(delivery.spatial?.distanceToDropoffMeters ?? null)}
              hint="Курьераас хүргэх цэг хүртэлх шууд зай"
            />
            <KpiCard
              label="Сүүлийн шинэчлэл"
              value={latestEvent ? formatDate(latestEvent.createdAt) : "Мэдээлэл алга"}
              hint="Шууд урсгал дээр харагдсан хамгийн сүүлийн үйл явдал"
            />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-6">
              <div className="glass-panel rounded-[2rem] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                      Шууд явцын самбар
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <StatusBadge status={delivery.status} />
                      <div className="rounded-full bg-[rgba(115,199,139,0.15)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--green)]">
                        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[var(--green)] align-middle animate-pulse" />
                        Хяналт идэвхтэй
                      </div>
                    </div>
                    <div className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                      {latestEvent?.message ?? "Таны хүргэлт одоогоор явж байна. Курьер байршил эсвэл төлөв шинэчлэх бүрт энэ хуудас автоматаар шинэчлэгдэнэ."}
                    </div>
                  </div>
                  <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-right text-sm text-[var(--muted)]">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Хяналтын код</div>
                    <div className="mt-2 font-mono text-sm text-[var(--text)]">{delivery.trackingCode}</div>
                  </div>
                </div>
              </div>

              <MapView
                title="Шууд хүргэлтийн зураг"
                markers={[
                  {
                    id: "pickup",
                    label: "Агуулах",
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
                          label: delivery.driver?.name ?? "Курьер",
                          latitude: latestLocation.latitude,
                          longitude: latestLocation.longitude,
                          color: "#16a34a",
                        },
                      ]
                    : []),
                ]}
                route={{
                  profile: "driving",
                  waypoints: latestLocation
                    ? [
                        {
                          id: "driver-route",
                          label: delivery.driver?.name ?? "Курьер",
                          latitude: latestLocation.latitude,
                          longitude: latestLocation.longitude,
                        },
                        {
                          id: "customer-route",
                          label: "Хүргэх цэг",
                          latitude: delivery.dropoffLat,
                          longitude: delivery.dropoffLng,
                        },
                      ]
                    : [
                        {
                          id: "pickup-route",
                          label: "Агуулах",
                          latitude: delivery.pickupLat,
                          longitude: delivery.pickupLng,
                        },
                        {
                          id: "customer-route",
                          label: "Хүргэх цэг",
                          latitude: delivery.dropoffLat,
                          longitude: delivery.dropoffLng,
                        },
                      ],
                  lineColor: "#2563eb",
                  summaryTitle: "Хамгийн хурдан машины зам",
                }}
              />
              <DeliveryTimeline events={delivery.events ?? []} />
            </div>

            <div className="space-y-6">
              <div className="glass-panel rounded-[2rem] p-5">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold text-[var(--text)]">Хүргэлтийн товч мэдээлэл</div>
                  <StatusBadge status={delivery.status} />
                </div>
                <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Агуулах</div>
                    <div className="mt-2">{delivery.pickupAddress}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Хүргэх цэг</div>
                    <div className="mt-2">{delivery.dropoffAddress}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Курьерын мэдээлэл</div>
                    <div className="mt-2">Курьер: {delivery.driver?.name ?? "Оноолт хүлээгдэж байна"}</div>
                    <div className="mt-2">Хүрэх хугацаа: {formatDate(delivery.eta ?? null)}</div>
                    <div className="mt-2">Курьераас агуулах хүртэл: {formatDistanceMeters(delivery.spatial?.distanceToPickupMeters ?? null)}</div>
                    <div className="mt-2">Курьераас хүргэх цэг хүртэл: {formatDistanceMeters(delivery.spatial?.distanceToDropoffMeters ?? null)}</div>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Сүүлийн үйлдэл</div>
                    <div className="mt-2">{latestEvent ? translateEventType(latestEvent.eventType) : "Одоогоор үйл явдал алга"}</div>
                    <div className="mt-2 text-[var(--muted)]">{latestEvent?.message ?? "Дараагийн хяналтын шинэчлэлтийг хүлээж байна."}</div>
                  </div>
                  {delivery.notes ? (
                    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Тэмдэглэл</div>
                      <div className="mt-2">{delivery.notes}</div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="glass-panel rounded-[2rem] p-5">
                <div className="text-lg font-semibold text-[var(--text)]">Явцын үе шат</div>
                <div className="mt-4 space-y-3">
                  {trackingStages.map((status, index) => {
                    const isComplete = currentStageIndex >= index;
                    const isCurrent = delivery.status === status;

                    return (
                      <div
                        key={status}
                        className={`rounded-[1.5rem] border px-4 py-4 transition ${
                          isCurrent
                            ? "border-[rgba(207,35,45,0.45)] bg-[rgba(207,35,45,0.12)]"
                            : isComplete
                              ? "border-[rgba(115,199,139,0.3)] bg-[rgba(115,199,139,0.1)]"
                              : "border-[var(--border)] bg-[var(--surface-2)]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold tracking-[0.12em] text-[var(--text)]">
                              {translateLabel(status)}
                            </div>
                            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                              {isCurrent ? "Одоогийн шат" : isComplete ? "Дууссан" : "Дараагийн шат"}
                            </div>
                          </div>
                          <div
                            className={`h-3 w-3 rounded-full ${
                              isCurrent
                                ? "bg-[var(--accent)]"
                                : isComplete
                                  ? "bg-[var(--green)]"
                                  : "bg-[rgba(183,183,178,0.5)]"
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {delivery.proof ? (
                <div className="glass-panel rounded-[2rem] p-5">
                  <div className="text-lg font-semibold text-[var(--text)]">Хүргэлтийн баталгаа</div>
                  <div className="mt-3 text-sm text-[var(--muted)]">
                    Хүлээн авагч: {delivery.proof.recipientName ?? "Мэдээлэл алга"}
                  </div>
                  <div className="text-sm text-[var(--muted)]">Тэмдэглэл: {delivery.proof.notes ?? "Байхгүй"}</div>
                  <div className="text-sm text-[var(--muted)]">
                    OTP баталгаажсан: {delivery.proof.otpVerified ? "Тийм" : "Үгүй"}
                  </div>
                  {delivery.proof.photoUrl ? (
                    <a className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]" href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${delivery.proof.photoUrl}`} target="_blank" rel="noreferrer">
                      Оруулсан баталгааг харах
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="glass-panel rounded-[2rem] p-5 text-sm text-[var(--muted)]">
                  Курьер хүргэлтээ дуусмагц хүргэлтийн баталгаа энд харагдана.
                </div>
              )}
            </div>

            <DeliveryProgressForm delivery={delivery} />
          </div>
        </>
      )}
    </SectionShell>
  );
}
