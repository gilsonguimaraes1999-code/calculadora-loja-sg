/** Camada de acesso à AwesomeAPI. Executada exclusivamente no servidor. */

const AWESOME_BASE_URL = "https://economia.awesomeapi.com.br/json/last";

export type CurrencyPair = {
  from: string;
  to: string;
};

export type FetchedRate = CurrencyPair & {
  rate: number;
  url: string;
  updatedAt: string;
};

type AwesomeItem = {
  code?: unknown;
  codein?: unknown;
  bid?: unknown;
  timestamp?: unknown;
  create_date?: unknown;
};

export function buildAwesomeRequest(currencies: string[], apiKey?: string) {
  const legs = Array.from(
    new Set(
      currencies.map((currency) => currency.toUpperCase()).filter((currency) => currency !== "BRL"),
    ),
  ).map((currency) => `${currency}-BRL`);

  const headers: Record<string, string> = { Accept: "application/json" };
  const normalizedKey = apiKey?.trim();
  if (normalizedKey) headers["x-api-key"] = normalizedKey;

  return {
    url: `${AWESOME_BASE_URL}/${legs.join(",")}`,
    headers,
  };
}

export function parseAwesomePayload(payload: unknown): {
  rates: Record<string, number>;
  updatedAt: string;
} {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Resposta inválida da AwesomeAPI");
  }

  const rates: Record<string, number> = { BRL: 1 };
  let latestTimestamp = 0;

  for (const rawItem of Object.values(payload as Record<string, AwesomeItem>)) {
    if (!rawItem || typeof rawItem !== "object") continue;
    if (typeof rawItem.code !== "string" || rawItem.codein !== "BRL") continue;

    const bid = Number(rawItem.bid);
    if (!Number.isFinite(bid) || bid <= 0) continue;
    rates[rawItem.code.toUpperCase()] = bid;

    const unixTimestamp = Number(rawItem.timestamp);
    if (Number.isFinite(unixTimestamp) && unixTimestamp > latestTimestamp) {
      latestTimestamp = unixTimestamp;
    }
  }

  if (Object.keys(rates).length === 1) {
    throw new Error("A AwesomeAPI não retornou cotações válidas");
  }

  return {
    rates,
    updatedAt: latestTimestamp
      ? new Date(latestTimestamp * 1000).toISOString()
      : new Date().toISOString(),
  };
}

export function deriveAwesomeRate(
  ratesToBrl: Record<string, number>,
  from: string,
  to: string,
): number {
  const source = from.toUpperCase();
  const target = to.toUpperCase();
  if (source === target) return 1;

  const sourceToBrl = source === "BRL" ? 1 : ratesToBrl[source];
  const targetToBrl = target === "BRL" ? 1 : ratesToBrl[target];
  if (!sourceToBrl || !targetToBrl) {
    throw new Error(`Cotação ${source}→${target} indisponível na AwesomeAPI`);
  }

  return sourceToBrl / targetToBrl;
}

export async function fetchAwesomeRates(
  pairs: CurrencyPair[],
  apiKey = process.env.AWESOME_API_KEY,
): Promise<FetchedRate[]> {
  const currencies = pairs.flatMap((pair) => [pair.from, pair.to]);
  const request = buildAwesomeRequest(currencies, apiKey);
  const response = await fetch(request.url, {
    headers: request.headers,
    signal: AbortSignal.timeout(15_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`AwesomeAPI respondeu ${response.status}`);
  }

  const parsed = parseAwesomePayload(await response.json());
  return pairs.map((pair) => ({
    from: pair.from.toUpperCase(),
    to: pair.to.toUpperCase(),
    rate: deriveAwesomeRate(parsed.rates, pair.from, pair.to),
    url: request.url,
    updatedAt: parsed.updatedAt,
  }));
}
