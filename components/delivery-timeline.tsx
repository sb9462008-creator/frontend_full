import { formatDate } from "../lib/format";
import { translateEventType } from "../lib/labels";
import type { TrackingEvent } from "../lib/types";
import { StatusBadge } from "./status-badge";

export function DeliveryTimeline({ events }: { events: TrackingEvent[] }) {
  return (
    <div className="glass-panel rounded-[2rem] p-5">
      <div className="mb-4 text-lg font-bold text-[#f5f5f3]">Хүргэлтийн явц</div>
      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
            <div className="mt-1 h-3 w-3 rounded-full bg-[var(--accent)]" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div className="font-semibold text-[#f5f5f3]">{translateEventType(event.eventType)}</div>
                {event.status ? <StatusBadge status={event.status} /> : null}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">{event.message ?? "Нэмэлт тайлбар алга"}</div>
              <div className="mt-2 text-xs font-mono text-[#8b8b86]">{formatDate(event.createdAt)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
