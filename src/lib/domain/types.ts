export const CURRENCIES = ["BRL", "USD", "GBP", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOL: Record<Currency, string> = {
  BRL: "R$",
  USD: "$",
  GBP: "£",
  EUR: "€",
};

export type City = {
  id: string;
  nome: string;
  moeda: Currency;
  /** Desconto concedido ao cliente pela cidade, em % (ex.: 20) */
  desconto: number;
  /** Multiplicador individual da TEBEX; vazio significa ×1. */
  tebexMultiplier: number | null;
};

export type RateQuote = {
  from: Currency;
  to: Currency;
  rate: number;
  source: "AwesomeAPI" | "Manual";
  updatedAt: string;
  url?: string;
};

export type CalcOptions = {
  arredondar: boolean;
  tebexMultiplier: number | null;
};

export type Step = { label: string; detail: string; value?: string };

export type CalcResult = {
  hub: number;
  tebex: number;
  moeda: Currency;
  tebexMoeda: Currency;
  manual: boolean;
  steps: Step[];
  cotacoes: RateQuote[];
};
