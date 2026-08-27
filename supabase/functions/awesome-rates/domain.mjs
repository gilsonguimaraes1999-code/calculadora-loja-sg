const AWESOME_BASE_URL = "https://economia.awesomeapi.com.br/json/last";

export function buildAwesomeRequest(currencies, apiKey) {
  const legs = Array.from(
    new Set(
      currencies
        .map((currency) => String(currency).toUpperCase())
        .filter((currency) => currency !== "BRL"),
    ),
  ).map((currency) => `${currency}-BRL`);
  const headers = { Accept: "application/json" };
  if (String(apiKey || "").trim()) headers["x-api-key"] = String(apiKey).trim();
  return { url: `${AWESOME_BASE_URL}/${legs.join(",")}`, headers };
}

export function parseAwesomePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload))
    throw new Error("Resposta inválida da AwesomeAPI.");
  const rates = { BRL: 1 };
  let latestTimestamp = 0;
  for (const item of Object.values(payload)) {
    if (!item || typeof item !== "object" || item.codein !== "BRL") continue;
    const bid = Number(item.bid);
    if (!Number.isFinite(bid) || bid <= 0) continue;
    rates[String(item.code).toUpperCase()] = bid;
    const timestamp = Number(item.timestamp);
    if (Number.isFinite(timestamp)) latestTimestamp = Math.max(latestTimestamp, timestamp);
  }
  if (Object.keys(rates).length === 1) throw new Error("Cotação válida não encontrada.");
  return {
    rates,
    updatedAt: latestTimestamp
      ? new Date(latestTimestamp * 1000).toISOString()
      : new Date().toISOString(),
  };
}

export function deriveAwesomeRate(ratesToBrl, from, to) {
  const source = String(from).toUpperCase();
  const target = String(to).toUpperCase();
  if (source === target) return 1;
  const sourceToBrl = source === "BRL" ? 1 : Number(ratesToBrl[source]);
  const targetToBrl = target === "BRL" ? 1 : Number(ratesToBrl[target]);
  if (!sourceToBrl || !targetToBrl) throw new Error(`Cotação ${source}→${target} indisponível.`);
  return sourceToBrl / targetToBrl;
}
