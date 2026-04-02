export function LiveLocationMarker({
  label,
  latitude,
  longitude,
}: {
  label: string;
  latitude: number;
  longitude: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm shadow-sm">
      <div className="font-semibold text-[var(--text)]">{label}</div>
      <div className="mt-1 font-mono text-xs text-[var(--muted)]">
        {latitude.toFixed(5)}, {longitude.toFixed(5)}
      </div>
    </div>
  );
}
