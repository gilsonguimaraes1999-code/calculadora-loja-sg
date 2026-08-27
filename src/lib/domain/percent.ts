export function stepPercent(value: string, delta: number): string {
  const current = Number(value.replace(",", ".")) || 0;
  const next = Math.max(0, Math.round((current + delta) * 100) / 100);
  return String(next).replace(".", ",");
}
