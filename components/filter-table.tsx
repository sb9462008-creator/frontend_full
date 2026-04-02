import { useMemo, useState } from "react";

export function FilterTable<T>({
  rows,
  getSearchText,
  renderRow,
  emptyMessage,
}: {
  rows: T[];
  getSearchText: (row: T) => string;
  renderRow: (row: T) => React.ReactNode;
  emptyMessage: string;
}) {
  const [query, setQuery] = useState("");

  const filteredRows = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    if (!lowered) {
      return rows;
    }

    return rows.filter((row) => getSearchText(row).toLowerCase().includes(lowered));
  }, [getSearchText, query, rows]);

  return (
    <div className="glass-panel rounded-[2rem] p-5">
      <div className="mb-4">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Шүүх эсвэл хайх"
          className="input-field"
        />
      </div>
      <div className="space-y-3">
        {filteredRows.length > 0 ? filteredRows.map((row) => renderRow(row)) : (
          <div className="rounded-2xl border border-dashed border-slate-900/15 bg-white/70 p-8 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}
