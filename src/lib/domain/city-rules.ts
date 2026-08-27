import type { City, Currency } from "./types";

export type CityDraft = Omit<City, "desconto" | "tebexMultiplier"> & {
  desconto: string;
  tebexMultiplier: string;
};

export type ConfigurationChange = {
  id: string;
  name: string;
  type: "updated" | "added" | "removed";
};

const parseDraftNumber = (value: string) => Number(value.replace(",", "."));

export function cityToDraft(city: City): CityDraft {
  return {
    ...city,
    desconto: String(city.desconto).replace(".", ","),
    tebexMultiplier:
      city.tebexMultiplier === null ? "" : String(city.tebexMultiplier).replace(".", ","),
  };
}

export function draftsToCities(drafts: CityDraft[]): City[] {
  return drafts.map((draft) => {
    const name = draft.nome.trim();
    if (!name) throw new Error("Informe o nome da cidade.");
    const discount = parseDraftNumber(draft.desconto);
    if (!Number.isFinite(discount) || discount < 0 || discount >= 100)
      throw new Error(`Desconto inválido em ${name}.`);
    const multiplier = draft.tebexMultiplier.trim()
      ? parseDraftNumber(draft.tebexMultiplier)
      : null;
    if (multiplier !== null && (!Number.isFinite(multiplier) || multiplier < 1))
      throw new Error(`Multiplicador TEBEX inválido em ${name}.`);
    return {
      id: draft.id,
      nome: name,
      moeda: draft.moeda,
      desconto: discount,
      tebexMultiplier: multiplier,
    };
  });
}

export function moveCityDraft(
  drafts: CityDraft[],
  id: string,
  direction: "up" | "down",
): CityDraft[] {
  const currentIndex = drafts.findIndex((draft) => draft.id === id);
  if (currentIndex < 0) return drafts;
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= drafts.length) return drafts;
  const reordered = [...drafts];
  [reordered[currentIndex], reordered[targetIndex]] = [
    reordered[targetIndex],
    reordered[currentIndex],
  ];
  return reordered;
}

function citiesEqual(left: City, right: City) {
  return (
    left.nome === right.nome &&
    left.moeda === right.moeda &&
    left.desconto === right.desconto &&
    left.tebexMultiplier === right.tebexMultiplier
  );
}

export function configurationChanges(saved: City[], drafts: CityDraft[]): ConfigurationChange[] {
  const changes: ConfigurationChange[] = [];
  const sameCities =
    saved.length === drafts.length &&
    saved.every((city) => drafts.some((draft) => draft.id === city.id));
  drafts.forEach((draft, index) => {
    const previous = saved.find((city) => city.id === draft.id);
    if (!previous) {
      changes.push({ id: draft.id, name: draft.nome || "Nova cidade", type: "added" });
      return;
    }
    try {
      const current = draftsToCities([draft])[0];
      if (
        !current ||
        !citiesEqual(previous, current) ||
        (sameCities && saved[index]?.id !== draft.id)
      )
        changes.push({ id: draft.id, name: draft.nome || previous.nome, type: "updated" });
    } catch {
      changes.push({ id: draft.id, name: draft.nome || previous.nome, type: "updated" });
    }
  });
  saved.forEach((city) => {
    if (!drafts.some((draft) => draft.id === city.id))
      changes.push({ id: city.id, name: city.nome, type: "removed" });
  });
  return changes;
}

export function inputCurrencyForMode(
  mode: "A" | "B" | "C",
  cityCurrency: Currency,
  selectedCurrency: Currency,
): Currency {
  return mode === "A" ? cityCurrency : selectedCurrency;
}

export function cityRecomposicao(city: { desconto: number }): number {
  const rate = city.desconto / 100;
  if (rate <= 0 || rate >= 1) return 0;
  return (1 / (1 - rate) - 1) * 100;
}

export function normalizeCity(value: Record<string, unknown>) {
  const rawMultiplier = value.tebexMultiplier ?? value.tebexFeePercentage;
  const multiplier =
    rawMultiplier === "" || rawMultiplier === null || rawMultiplier === undefined
      ? null
      : Number(rawMultiplier);
  return {
    id: String(value.id ?? ""),
    nome: String(value.nome ?? ""),
    moeda: String(value.moeda ?? "BRL") as "BRL" | "USD" | "GBP" | "EUR",
    desconto: Number(value.desconto ?? 0),
    tebexMultiplier: Number.isFinite(multiplier) && multiplier! >= 1 ? multiplier : null,
  };
}

export function normalizeCities(values: unknown[]): City[] {
  return values
    .filter(
      (value): value is Record<string, unknown> => Boolean(value) && typeof value === "object",
    )
    .map(normalizeCity);
}
