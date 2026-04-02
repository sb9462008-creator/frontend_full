export function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="glass-panel relative overflow-hidden rounded-[1rem] p-5">
      <div className="absolute inset-x-0 top-0 h-1 bg-[var(--accent)]" />
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{label}</div>
      <div className="mt-4 text-4xl font-extrabold text-[#f5f5f3]">{value}</div>
      <div className="mt-2 text-sm text-[var(--muted)]">{hint}</div>
    </div>
  );
}
