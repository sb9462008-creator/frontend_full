import clsx from "clsx";

import { translateLabel } from "../lib/labels";
import type { DeliveryStatus, DriverStatus, OrderStatus } from "../lib/types";

const toneMap: Record<string, string> = {
  PENDING: "bg-[rgba(241,193,75,0.15)] text-[var(--yellow)]",
  ASSIGNED: "bg-[rgba(134,184,255,0.15)] text-[var(--blue)]",
  ACCEPTED: "bg-[rgba(255,77,87,0.15)] text-[var(--accent-2)]",
  PICKED_UP: "bg-[rgba(197,156,255,0.15)] text-[var(--purple)]",
  IN_TRANSIT: "bg-[rgba(207,35,45,0.15)] text-[var(--accent)]",
  NEAR_DESTINATION: "bg-[rgba(197,156,255,0.15)] text-[var(--purple)]",
  DELIVERED: "bg-[rgba(115,199,139,0.15)] text-[var(--green)]",
  FAILED: "bg-[rgba(255,90,95,0.15)] text-[var(--red)]",
  RETURNED: "bg-[rgba(183,183,178,0.15)] text-[#d3d3cf]",
  CANCELLED: "bg-[rgba(255,90,95,0.15)] text-[var(--red)]",
  AVAILABLE: "bg-[rgba(115,199,139,0.15)] text-[var(--green)]",
  BUSY: "bg-[rgba(241,193,75,0.15)] text-[var(--yellow)]",
  OFFLINE: "bg-[rgba(183,183,178,0.15)] text-[#d3d3cf]",
  PLACED: "bg-[rgba(183,183,178,0.15)] text-[#d3d3cf]",
  PROCESSING: "bg-[rgba(207,35,45,0.15)] text-[var(--accent-2)]",
  SHIPPED: "bg-[rgba(134,184,255,0.15)] text-[var(--blue)]",
};

export function StatusBadge({ status }: { status: DeliveryStatus | DriverStatus | OrderStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.04em]",
        toneMap[status] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {translateLabel(status)}
    </span>
  );
}
