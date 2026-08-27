import {
  type CalcOptions,
  type CalcResult,
  type City,
  type Currency,
  type RateQuote,
  type Step,
} from "./types";
import { formatMoney, formatNumber, formatPercent } from "./format";
import { calculateTebex } from "./tebex";
import { cityRecomposicao as deriveCityRecomposicao } from "./city-rules";

export function roundUp2(value: number): number {
  return Math.ceil(value * 100) / 100;
}

export function ceilInteger(value: number): number {
  return Math.ceil(value - 1e-9);
}

/** Recomposição derivada do desconto: 1/(1-d) - 1 */
export function recomposicaoInversa(descontoPercent: number): number {
  const d = descontoPercent / 100;
  if (d <= 0 || d >= 1) return 0;
  return (1 / (1 - d) - 1) * 100;
}

export function cityRecomposicao(city: City): number {
  return deriveCityRecomposicao(city);
}

function applyRounding(value: number, options: CalcOptions, steps: Step[], moeda: Currency) {
  if (!options.arredondar) return value;
  const rounded = ceilInteger(value);
  steps.push({
    label: "Arredondamento (sempre para cima)",
    detail: `${formatMoney(value, moeda)} → ${formatMoney(rounded, moeda)}`,
    value: formatMoney(rounded, moeda),
  });
  return rounded;
}

function applyTebex(
  hub: number,
  discountPercentage: number,
  options: CalcOptions,
  steps: Step[],
  cotacoes: RateQuote[],
  moeda: Currency,
  convert: ConvertFn,
) {
  const result = calculateTebex({
    hub,
    moeda,
    discountPercentage,
    multiplier: options.tebexMultiplier,
    arredondar: options.arredondar,
    convert,
  });

  steps.push({
    label: `Base TEBEX após desconto (${formatPercent(discountPercentage)})`,
    detail: `${formatMoney(hub, moeda)} × ${formatNumber(
      1 - discountPercentage / 100,
      6,
    )} = ${formatMoney(result.discountedValue, moeda)}`,
  });

  if (result.quote) {
    cotacoes.push(result.quote);
    steps.push({
      label: `Conversão TEBEX ${moeda} → ${result.moeda}`,
      detail: `${formatMoney(result.discountedValue, moeda)} × ${formatNumber(
        result.quote.rate,
        6,
      )} = ${formatMoney(result.baseValue, result.moeda)}`,
    });
  }

  if (result.multiplier !== 1) {
    steps.push({
      label: `Multiplicador TEBEX (×${formatNumber(result.multiplier, 6)})`,
      detail: `${formatMoney(result.baseValue, result.moeda)} × ${formatNumber(
        result.multiplier,
        6,
      )} = ${formatMoney(result.rawValue, result.moeda)}`,
    });
  } else {
    steps.push({ label: "Multiplicador TEBEX", detail: "Nenhum multiplicador configurado (×1)" });
  }

  if (options.arredondar && result.value !== result.rawValue) {
    steps.push({
      label: "Arredondamento TEBEX (para cima)",
      detail: `${formatMoney(result.rawValue, result.moeda)} → ${formatMoney(result.value, result.moeda)}`,
    });
  }
  return result;
}

export type ConvertFn = (
  value: number,
  from: Currency,
  to: Currency,
) => { value: number; quote?: RateQuote };

/** MODO A — preço original conhecido, aplica recomposição da cidade */
export function calcModoA(params: {
  precoOriginal: number;
  moedaOrigem: Currency;
  cidade: City;
  options: CalcOptions;
  convert: ConvertFn;
}): CalcResult {
  const { precoOriginal, moedaOrigem, cidade, options, convert } = params;
  const steps: Step[] = [];
  const cotacoes: RateQuote[] = [];

  steps.push({
    label: "Preço original",
    detail: formatMoney(precoOriginal, moedaOrigem),
  });

  let base = precoOriginal;
  if (moedaOrigem !== cidade.moeda) {
    const { value, quote } = convert(precoOriginal, moedaOrigem, cidade.moeda);
    if (quote) cotacoes.push(quote);
    steps.push({
      label: `Conversão ${moedaOrigem} → ${cidade.moeda}`,
      detail: `${formatMoney(precoOriginal, moedaOrigem)} × ${formatNumber(
        quote?.rate ?? 1,
        6,
      )} = ${formatMoney(value, cidade.moeda)}`,
    });
    base = value;
  }

  const rec = cityRecomposicao(cidade);
  const rawHub = base * (1 + rec / 100);
  steps.push({
    label: `Recomposição ${cidade.nome} (+${formatPercent(rec)})`,
    detail: `${formatMoney(base, cidade.moeda)} × ${formatNumber(1 + rec / 100, 6)} = ${formatMoney(
      rawHub,
      cidade.moeda,
    )}`,
  });

  const hub = applyRounding(rawHub, options, steps, cidade.moeda);
  const tebex = applyTebex(
    rawHub,
    cidade.desconto,
    options,
    steps,
    cotacoes,
    cidade.moeda,
    convert,
  );

  steps.push({
    label: "Conferência",
    detail: `Com o desconto de ${formatPercent(cidade.desconto)} da cidade, o cliente paga ${formatMoney(
      hub * (1 - cidade.desconto / 100),
      cidade.moeda,
    )}`,
  });

  return {
    hub,
    tebex: tebex.value,
    moeda: cidade.moeda,
    tebexMoeda: tebex.moeda,
    manual: false,
    steps,
    cotacoes,
  };
}

/** MODO B — valor final que o cliente precisa pagar; usa fórmula inversa do desconto */
export function calcModoB(params: {
  valorFinalCliente: number;
  moedaOrigem: Currency;
  cidade: City;
  options: CalcOptions;
  convert: ConvertFn;
}): CalcResult {
  const { valorFinalCliente, moedaOrigem, cidade, options, convert } = params;
  const steps: Step[] = [];
  const cotacoes: RateQuote[] = [];

  steps.push({
    label: "Valor final que o cliente deve pagar",
    detail: formatMoney(valorFinalCliente, moedaOrigem),
  });

  let alvo = valorFinalCliente;
  if (moedaOrigem !== cidade.moeda) {
    const { value, quote } = convert(valorFinalCliente, moedaOrigem, cidade.moeda);
    if (quote) cotacoes.push(quote);
    steps.push({
      label: `Conversão ${moedaOrigem} → ${cidade.moeda}`,
      detail: `${formatMoney(valorFinalCliente, moedaOrigem)} × ${formatNumber(
        quote?.rate ?? 1,
        6,
      )} = ${formatMoney(value, cidade.moeda)}`,
    });
    alvo = value;
  }

  const d = cidade.desconto / 100;
  const rawHub = d > 0 && d < 1 ? alvo / (1 - d) : alvo;
  steps.push({
    label: `Fórmula inversa do desconto (${formatPercent(cidade.desconto)})`,
    detail: `${formatMoney(alvo, cidade.moeda)} ÷ ${formatNumber(1 - d, 6)} = ${formatMoney(
      rawHub,
      cidade.moeda,
    )}`,
  });

  const hub = applyRounding(rawHub, options, steps, cidade.moeda);
  const tebex = applyTebex(
    rawHub,
    cidade.desconto,
    options,
    steps,
    cotacoes,
    cidade.moeda,
    convert,
  );

  return {
    hub,
    tebex: tebex.value,
    moeda: cidade.moeda,
    tebexMoeda: tebex.moeda,
    manual: false,
    steps,
    cotacoes,
  };
}

/** MODO C — converter produto de uma cidade para outra */
export function calcModoC(params: {
  precoOrigem: number;
  origem: City;
  destino: City;
  options: CalcOptions;
  convert: ConvertFn;
}): CalcResult {
  const { precoOrigem, origem, destino, options, convert } = params;
  const steps: Step[] = [];
  const cotacoes: RateQuote[] = [];

  steps.push({
    label: `Preço atual em ${origem.nome}`,
    detail: formatMoney(precoOrigem, origem.moeda),
  });

  const recOrigem = cityRecomposicao(origem);
  const base = precoOrigem / (1 + recOrigem / 100);
  steps.push({
    label: `Remoção da regra de ${origem.nome} (−recomposição de ${formatPercent(recOrigem)})`,
    detail: `${formatMoney(precoOrigem, origem.moeda)} ÷ ${formatNumber(
      1 + recOrigem / 100,
      6,
    )} = ${formatMoney(base, origem.moeda)} (valor base limpo)`,
  });

  let baseDestino = base;
  if (origem.moeda !== destino.moeda) {
    const { value, quote } = convert(base, origem.moeda, destino.moeda);
    if (quote) cotacoes.push(quote);
    steps.push({
      label: `Conversão ${origem.moeda} → ${destino.moeda}`,
      detail: `${formatMoney(base, origem.moeda)} × ${formatNumber(
        quote?.rate ?? 1,
        6,
      )} = ${formatMoney(value, destino.moeda)}`,
    });
    baseDestino = value;
  } else {
    steps.push({
      label: "Conversão de moeda",
      detail: `Não necessária — ambas as cidades usam ${destino.moeda}`,
    });
  }

  const recDestino = cityRecomposicao(destino);
  const rawHub = baseDestino * (1 + recDestino / 100);
  steps.push({
    label: `Regra aplicada em ${destino.nome} (+${formatPercent(recDestino)})`,
    detail: `${formatMoney(baseDestino, destino.moeda)} × ${formatNumber(
      1 + recDestino / 100,
      6,
    )} = ${formatMoney(rawHub, destino.moeda)}`,
  });

  const hub = applyRounding(rawHub, options, steps, destino.moeda);
  const tebex = applyTebex(
    rawHub,
    destino.desconto,
    options,
    steps,
    cotacoes,
    destino.moeda,
    convert,
  );

  return {
    hub,
    tebex: tebex.value,
    moeda: destino.moeda,
    tebexMoeda: tebex.moeda,
    manual: false,
    steps,
    cotacoes,
  };
}
