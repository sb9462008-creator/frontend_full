"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";

import { DeliveryTimeline } from "@/components/delivery-timeline";
import { MapView } from "@/components/map-view";
import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { getLatestDriverLocation } from "@/lib/driver-location";
import { useProtectedRoute } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { translateLabel } from "@/lib/labels";
import { translateProductCategory } from "@/lib/product-copy";
import type { Order } from "@/lib/types";

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { auth, ready, isAuthorized } = useProtectedRoute("customer");
  const orderQuery = useQuery({
    queryKey: ["orders", params.id],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<Order>(`/orders/${params.id}`, { token: auth?.accessToken }),
    refetchInterval: 15_000,
  });

  if (!ready || !isAuthorized) {
    return null;
  }

  const order = orderQuery.data;

  if (!order) {
    return <div className="px-6 py-12 text-sm text-[var(--muted)]">Захиалгын мэдээллийг ачаалж байна...</div>;
  }

  const markers = order.delivery
    ? [
        {
          id: `${order.id}-pickup`,
          label: "Агуулах",
          latitude: order.delivery.pickupLat,
          longitude: order.delivery.pickupLng,
          color: "#f97316",
        },
        {
          id: `${order.id}-dropoff`,
          label: "Хүргэлтийн хаяг",
          latitude: order.delivery.dropoffLat,
          longitude: order.delivery.dropoffLng,
          color: "#0f172a",
        },
      ]
    : [];
  const latestLocation = getLatestDriverLocation(order.delivery?.driver);

  return (
    <SectionShell
      eyebrow="Захиалгын дэлгэрэнгүй"
      title={order.orderNumber}
      description="Захиалсан бараа, холбогдсон хүргэлт болон үүссэнээс эцсийн хүргэлт хүртэлх бүх үйл явцыг хянаарай."
      actions={
        <Link href="/orders" className="secondary-button">
          Захиалгууд руу буцах
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          {order.delivery ? (
            <MapView
              title="Хүргэлтийн маршрут"
              markers={[
                ...markers,
                ...(latestLocation
                  ? [
                      {
                        id: `${order.id}-driver`,
                        label: order.delivery.driver?.name ?? "Курьер",
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
                        id: `${order.id}-driver-route`,
                        label: order.delivery.driver?.name ?? "Курьер",
                        latitude: latestLocation.latitude,
                        longitude: latestLocation.longitude,
                      },
                      {
                        id: `${order.id}-dropoff-route`,
                        label: "Хүргэлтийн хаяг",
                        latitude: order.delivery.dropoffLat,
                        longitude: order.delivery.dropoffLng,
                      },
                    ]
                  : [
                      {
                        id: `${order.id}-pickup-route`,
                        label: "Агуулах",
                        latitude: order.delivery.pickupLat,
                        longitude: order.delivery.pickupLng,
                      },
                      {
                        id: `${order.id}-dropoff-route`,
                        label: "Хүргэлтийн хаяг",
                        latitude: order.delivery.dropoffLat,
                        longitude: order.delivery.dropoffLng,
                      },
                    ],
                lineColor: "#2563eb",
                summaryTitle: "Хамгийн хурдан машины зам",
              }}
            />
          ) : null}
          {order.delivery?.events?.length ? <DeliveryTimeline events={order.delivery.events} /> : null}
        </div>

        <div className="space-y-6">
          <div className="glass-panel rounded-[2rem] p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="text-lg font-semibold text-[var(--text)]">Захиалгын төлөв</div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-4 text-sm leading-7 text-[var(--muted)]">
              <div>Үүссэн: {formatDate(order.createdAt)}</div>
              <div>Хүргэлтийн хаяг: {order.shippingAddress}</div>
              <div>Нийт: {formatCurrency(order.totalAmountCents)}</div>
              {order.delivery ? <div>Хүргэлтийн төлөв: {translateLabel(order.delivery.status)}</div> : null}
              {order.delivery ? <div>Хяналтын код: {order.delivery.trackingCode}</div> : null}
            </div>
          </div>

          <div className="glass-panel rounded-[2rem] p-6">
            <div className="text-lg font-semibold text-[var(--text)]">Бараанууд</div>
            <div className="mt-4 space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-[var(--text)]">{item.product.name}</div>
                      <div className="mt-1 text-sm text-[var(--muted)]">{translateProductCategory(item.product.category)}</div>
                    </div>
                    <div className="text-right text-sm text-[var(--muted)]">
                      <div>Тоо {item.quantity}</div>
                      <div>{formatCurrency(item.unitPriceCents)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
