export function formatDate(value?: string | null) {
  if (!value) {
    return "Мэдээлэл алга";
  }

  return new Intl.DateTimeFormat("mn-MN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function shortNumber(value: number) {
  return new Intl.NumberFormat("mn-MN").format(value);
}

export function formatCurrency(cents: number) {
  const absoluteCents = Math.abs(cents);
  const dollars = Math.floor(absoluteCents / 100);
  const remainder = String(absoluteCents % 100).padStart(2, "0");
  const groupedDollars = dollars.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return `${cents < 0 ? "-" : ""}$${groupedDollars}.${remainder}`;
}

export function formatDistanceMeters(value?: number | null) {
  if (value == null) {
    return "Мэдээлэл алга";
  }

  if (value >= 1000) {
    const kilometers = value / 1000;
    return `${kilometers >= 10 ? kilometers.toFixed(0) : kilometers.toFixed(1)} km`;
  }

  return `${Math.round(value)} m`;
}

export function formatDurationSeconds(value?: number | null) {
  if (value == null || Number.isNaN(value)) {
    return "Мэдээлэл алга";
  }

  const totalMinutes = Math.max(1, Math.round(value / 60));

  if (totalMinutes < 60) {
    return `${totalMinutes} мин`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} цаг`;
  }

  return `${hours} цаг ${minutes} мин`;
}
