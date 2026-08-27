const ROLES = new Set(["owner", "admin", "member"]);
const STATUSES = new Set(["pending", "rejected", "approved"]);
const CURRENCIES = new Set(["BRL", "USD", "GBP", "EUR"]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function cityFromRow(row) {
  const currency = String(row.currency || "").toUpperCase();
  if (!CURRENCIES.has(currency)) throw new Error("Moeda de cidade inválida.");
  return {
    id: String(row.id),
    nome: String(row.name || "").trim(),
    moeda: currency,
    desconto: number(row.discount),
    tebexMultiplier:
      row.tebex_multiplier === null || row.tebex_multiplier === ""
        ? null
        : number(row.tebex_multiplier),
  };
}

export function cityToRow(city, position) {
  return {
    id: UUID_PATTERN.test(String(city.id || "")) ? city.id : null,
    name: String(city.nome || "").trim(),
    currency: city.moeda,
    discount: number(city.desconto),
    tebexMultiplier:
      city.tebexMultiplier === null || city.tebexMultiplier === ""
        ? null
        : number(city.tebexMultiplier),
    position,
  };
}

export function profileFromRow(row) {
  const role = ROLES.has(row.role) ? row.role : "member";
  const status = STATUSES.has(row.status) ? row.status : "pending";
  return {
    id: String(row.id),
    name: String(row.name || "").trim(),
    email: String(row.email || "")
      .trim()
      .toLowerCase(),
    role,
    approved: status === "approved",
    status,
    active: Boolean(row.active),
  };
}

export function auditFromRow(row) {
  return {
    timestamp: String(row.created_at),
    actorId: row.actor_id ? String(row.actor_id) : "system",
    action: String(row.action),
    targetId: row.target_id ? String(row.target_id) : "",
    details: JSON.stringify(row.details || {}),
  };
}
