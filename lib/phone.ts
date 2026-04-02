export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 15);
}
