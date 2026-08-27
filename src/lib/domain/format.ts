import { CURRENCY_SYMBOL, type Currency } from "./types";

export function formatMoney(value: number, moeda: Currency): string {
  return `${CURRENCY_SYMBOL[moeda]} ${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number, digits = 4): string {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
}

export function formatPercent(value: number): string {
  return `${formatNumber(value, 2)}%`;
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
