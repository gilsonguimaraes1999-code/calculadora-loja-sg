export type TebexCurrency = "BRL" | "USD" | "GBP" | "EUR";

export type TebexQuote = {
  from: TebexCurrency;
  to: TebexCurrency;
  rate: number;
  source: "AwesomeAPI" | "Manual";
  updatedAt: string;
  url?: string;
};

export type TebexConvert = (
  value: number,
  from: TebexCurrency,
  to: TebexCurrency,
) => { value: number; quote?: TebexQuote };

export function calculateTebex(params: {
  hub: number;
  moeda: TebexCurrency;
  discountPercentage: number;
  multiplier: number | null;
  arredondar: boolean;
  convert: TebexConvert;
}) {
  const tebexMoeda: TebexCurrency = params.moeda === "BRL" ? "USD" : params.moeda;
  const discountFactor = 1 - params.discountPercentage / 100;
  const discountedValue = params.hub * discountFactor;
  const converted = params.convert(discountedValue, params.moeda, tebexMoeda);
  const multiplier = params.multiplier ?? 1;
  const rawValue = converted.value * multiplier;
  const value = params.arredondar
    ? Math.ceil(rawValue - 1e-9)
    : Math.ceil(rawValue * 100 - 1e-9) / 100;

  return {
    value,
    moeda: tebexMoeda,
    discountedValue,
    baseValue: converted.value,
    rawValue,
    multiplier,
    ...(converted.quote ? { quote: converted.quote } : {}),
  };
}
