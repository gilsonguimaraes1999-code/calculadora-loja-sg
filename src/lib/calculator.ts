export function formatDateTime(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "horário indisponível";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export interface CalculatorResult {
  finalValue: number;
  discountRate: number;
  exactStoreValue: number;
  roundedStoreValue: number;
  afterDiscountApprox: number;
}

export function parseCurrencyInput(value: string): number {
  if (!value) return 0;
  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "") // remove pontos de milhar
    .replace(",", "."); // vírgula decimal -> ponto
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function parsePercentInput(value: string): number {
  if (!value) return 0;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatConvertedCurrency(value: number, currency: string): string {
  const numericValue = Number.isFinite(value) ? value : 0;
  const maximumFractionDigits = Math.abs(numericValue) > 0 && Math.abs(numericValue) < 1 ? 4 : 2;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits,
  }).format(numericValue);
}

/** Arredonda para 2 casas decimais (centavos) evitando erros de ponto flutuante. */
export function roundToCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Arredonda para cima ao próximo centavo. */
export function ceilToCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.ceil((value - Number.EPSILON) * 100) / 100;
}

export function calculateStorePrice(
  finalValue: number,
  discountRate: number,
  roundUp: boolean,
): CalculatorResult {
  const discountFactor = discountRate > 0 && discountRate < 100 ? 1 - discountRate / 100 : 1;
  const exactStoreValueRaw = discountFactor > 0 ? finalValue / discountFactor : 0;
  const exactStoreValue = roundToCents(exactStoreValueRaw);
  const roundedStoreValue =
    roundUp && exactStoreValueRaw > 0 ? Math.ceil(exactStoreValueRaw) : exactStoreValue;
  const afterDiscountApprox = roundToCents(roundedStoreValue * discountFactor);

  return {
    finalValue: roundToCents(finalValue),
    discountRate,
    exactStoreValue,
    roundedStoreValue,
    afterDiscountApprox,
  };
}

export function convertCurrency(value: number, rate: number): number {
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return value * rate;
}
