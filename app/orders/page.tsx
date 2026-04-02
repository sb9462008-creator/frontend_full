"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { SectionShell } from "@/components/section-shell";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { useProtectedRoute } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Order } from "@/lib/types";

export default function OrdersPage() {
  const { auth, ready, isAuthorized } = useProtectedRoute("customer");
  const ordersQuery = useQuery({
    queryKey: ["orders", "my", auth?.user.id ?? "anonymous"],
    enabled: isAuthorized && !!auth?.accessToken,
    queryFn: () => apiFetch<Order[]>("/orders/my", { token: auth?.accessToken }),
    refetchOnMount: "always",
    staleTime: 0,
  });

  if (!ready || !isAuthorized) {
    return null;
  }

  const orders = ordersQuery.data ?? [];

  return (
    <SectionShell
      eyebrow="Хэрэглэгчийн захиалгууд"
      title="Миний захиалгууд"
      description="Захиалсан бараагаа шалгаж, дэлгэрэнгүйг нээгээд, холбогдсон хүргэлтийн төлөвийг дагана."
      actions={
        <Link href="/shop" className="primary-button">
          Дэлгүүр үргэлжлүүлэх
        </Link>
      }
    >
      <div className="space-y-4">
        {ordersQuery.isLoading ? (
          <div className="glass-panel rounded-[2rem] p-6 text-sm text-[var(--muted)]">
            Захиалгуудыг ачаалж байна...
          </div>
        ) : null}

        {ordersQuery.error instanceof Error ? (
          <div className="glass-panel rounded-[2rem] border border-[rgba(255,90,95,0.34)] bg-[rgba(255,90,95,0.12)] p-6 text-sm text-[var(--red)]">
            Захиалгуудыг ачаалж чадсангүй. {ordersQuery.error.message}
          </div>
        ) : null}

        {orders.length === 0 ? (
          <div className="glass-panel rounded-[2rem] p-6 text-sm text-[var(--muted)]">
            Та одоогоор захиалга хийгээгүй байна.
          </div>
        ) : null}

        {orders.map((order) => (
          <Link
            key={order.id}
            href={`/orders/${order.id}`}
            className="glass-panel block rounded-[1.5rem] p-6 transition-transform hover:-translate-y-1 hover:border-[rgba(207,35,45,0.55)]"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent)]">
                  {order.orderNumber}
                </div>
                <h2 className="mt-2 text-xl font-semibold text-[var(--text)]">
                  {order.items.map((item) => item.product.name).join(", ")}
                </h2>
                <div className="mt-2 text-sm text-[var(--muted)]">{order.shippingAddress}</div>
                <div className="mt-2 text-sm text-[var(--muted)]">{formatDate(order.createdAt)}</div>
              </div>
              <div className="flex flex-col items-end gap-3">
                <StatusBadge status={order.status} />
                {order.delivery ? <StatusBadge status={order.delivery.status} /> : null}
                <div className="text-lg font-semibold text-[var(--text)]">{formatCurrency(order.totalAmountCents)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
