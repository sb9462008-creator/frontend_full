import type { Driver } from "./types";

export function getLatestDriverLocation(driver?: Pick<Driver, "latestLocation" | "locations"> | null) {
  return driver?.latestLocation ?? driver?.locations?.[0] ?? null;
}
