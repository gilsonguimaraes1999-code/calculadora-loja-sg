import { corsHeaders, json } from "../_shared/cors.ts";
import { authenticatedProfile } from "../_shared/auth.ts";
import { buildAwesomeRequest, deriveAwesomeRate, parseAwesomePayload } from "./domain.mjs";

const CURRENCIES = new Set(["BRL", "USD", "GBP", "EUR"]);

function requestedPairs(body: unknown) {
  const raw = (body as { pairs?: Array<{ from?: string; to?: string }> })?.pairs;
  if (!Array.isArray(raw) || !raw.length) throw new Error("Pares de cotação inválidos.");
  return raw.map((pair) => {
    const from = String(pair.from || "").toUpperCase();
    const to = String(pair.to || "").toUpperCase();
    if (!CURRENCIES.has(from) || !CURRENCIES.has(to)) throw new Error("Moeda inválida.");
    return { from, to };
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);
  try {
    const { admin, profile } = await authenticatedProfile(request);
    if (profile.status !== "approved" || !profile.active)
      return json({ error: "Acesso ainda não aprovado." }, 403);
    const pairs = requestedPairs(await request.json());
    const pairKeys = pairs.map(({ from, to }) => `${from}-${to}`);
    const { data: cached } = await admin.from("exchange_rates").select("*").in("pair", pairKeys);
    const cachedByPair = new Map((cached || []).map((row) => [row.pair, row]));

    try {
      const apiKey = Deno.env.get("AWESOME_API_KEY")?.trim();
      if (!apiKey) throw new Error("AWESOME_API_KEY não configurada.");
      const requestConfig = buildAwesomeRequest(
        pairs.flatMap(({ from, to }) => [from, to]),
        apiKey,
      );
      const response = await fetch(requestConfig.url, { headers: requestConfig.headers });
      if (!response.ok) throw new Error(`AwesomeAPI respondeu ${response.status}.`);
      const parsed = parseAwesomePayload(await response.json());
      const rows = pairs.map(({ from, to }) => ({
        pair: `${from}-${to}`,
        base_currency: from,
        quote_currency: to,
        rate: deriveAwesomeRate(parsed.rates, from, to),
        source: "AwesomeAPI",
        fetched_at: parsed.updatedAt,
      }));
      const { error } = await admin.from("exchange_rates").upsert(rows, { onConflict: "pair" });
      if (error) throw error;
      return json(
        rows.map((row) => ({
          from: row.base_currency,
          to: row.quote_currency,
          rate: row.rate,
          source: row.source,
          updatedAt: row.fetched_at,
        })),
      );
    } catch (refreshError) {
      const fallback = pairs.map(({ from, to }) => cachedByPair.get(`${from}-${to}`));
      if (fallback.some((row) => !row)) throw refreshError;
      return json(
        fallback.map((row) => ({
          from: row.base_currency,
          to: row.quote_currency,
          rate: Number(row.rate),
          source: row.source,
          updatedAt: row.fetched_at,
          stale: true,
        })),
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cotação indisponível.";
    const status = /aprovado|sessão/i.test(message) ? 403 : 503;
    return json({ error: status === 503 ? "Cotação indisponível no momento." : message }, status);
  }
});
