import { useCallback, useEffect, useState } from "react";
import type { City } from "./types";
import { normalizeCity } from "./city-rules";

// v2 força a migração do conjunto antigo de cidades para a lista atualizada.
const STORAGE_KEY = "price-calculator:cities:v3";

/**
 * Cidades pré-cadastradas.
 * Onde moeda ainda não foi confirmada, usamos BRL apenas como valor temporário
 * editável para que a cidade já exista no sistema. O usuário pode corrigir em
 * Configurações assim que tiver o dado oficial.
 */
export const DEFAULT_CITIES: City[] = [
  { id: "santa", nome: "Santa", moeda: "BRL", desconto: 30, tebexMultiplier: null },
  { id: "nobre", nome: "Nobre", moeda: "BRL", desconto: 30, tebexMultiplier: null },
  { id: "grande", nome: "Grande", moeda: "BRL", desconto: 30, tebexMultiplier: null },
  { id: "maresia", nome: "Maresia", moeda: "BRL", desconto: 30, tebexMultiplier: null },
  { id: "fronteira", nome: "Fronteira", moeda: "BRL", desconto: 30, tebexMultiplier: null },
  { id: "krown", nome: "Krown", moeda: "BRL", desconto: 30, tebexMultiplier: null },
  { id: "kng", nome: "KNG", moeda: "GBP", desconto: 20, tebexMultiplier: null },
  {
    id: "district-99",
    nome: "District 99 / D99",
    moeda: "BRL",
    desconto: 25,
    tebexMultiplier: null,
  },
  { id: "liberty-99", nome: "Liberty 99", moeda: "BRL", desconto: 25, tebexMultiplier: null },
  { id: "orizon", nome: "Orizon", moeda: "BRL", desconto: 25, tebexMultiplier: null },
  { id: "royal", nome: "Royal", moeda: "GBP", desconto: 30, tebexMultiplier: null },
  // Dados ainda não confirmados: mantidos editáveis com valores neutros.
  { id: "malta", nome: "Malta", moeda: "BRL", desconto: 0, tebexMultiplier: null },
  { id: "prime", nome: "Prime", moeda: "BRL", desconto: 0, tebexMultiplier: null },
  { id: "real", nome: "Real", moeda: "BRL", desconto: 0, tebexMultiplier: null },
];

function isCity(value: unknown): value is City {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c["id"] === "string" &&
    typeof c["nome"] === "string" &&
    typeof c["moeda"] === "string" &&
    typeof c["desconto"] === "number"
  );
}

export function loadCities(): City[] {
  if (typeof window === "undefined") return DEFAULT_CITIES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CITIES;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_CITIES;
    const cities = parsed
      .filter(isCity)
      .map((city) => normalizeCity(city as unknown as Record<string, unknown>));
    return cities.length ? cities : DEFAULT_CITIES;
  } catch {
    return DEFAULT_CITIES;
  }
}

export function saveCities(cities: City[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cities));
}

export function useCities() {
  const [cities, setCities] = useState<City[]>(DEFAULT_CITIES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCities(loadCities());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: City[]) => {
    setCities(next);
    saveCities(next);
  }, []);

  const upsertCity = useCallback(
    (city: City) =>
      persist(
        cities.some((c) => c.id === city.id)
          ? cities.map((c) => (c.id === city.id ? city : c))
          : [...cities, city],
      ),
    [cities, persist],
  );

  const removeCity = useCallback(
    (id: string) => persist(cities.filter((c) => c.id !== id)),
    [cities, persist],
  );

  const resetCities = useCallback(() => persist(DEFAULT_CITIES), [persist]);

  return { cities, hydrated, upsertCity, removeCity, resetCities };
}
