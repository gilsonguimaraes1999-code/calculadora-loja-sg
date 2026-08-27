import type { Currency } from "./types";

export function manualRateInput(from: Currency, to: Currency) {
  const inverted = from === "BRL" && to !== "BRL";
  return inverted ? { from: to, to: from, inverted } : { from, to, inverted };
}

export function manualRateForPair(
  from: Currency,
  to: Currency,
  inputRate: number | string,
): number {
  const parsed = typeof inputRate === "string" ? Number(inputRate.replace(",", ".")) : inputRate;
  if (!Number.isFinite(parsed) || parsed <= 0) return Number.NaN;
  return manualRateInput(from, to).inverted ? 1 / parsed : parsed;
}
