import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { backend } from "@/lib/backend/client";
import { friendlyRateError } from "./rate-errors.mjs";
import type { Currency, RateQuote } from "./types";
import { manualRateForPair } from "./manual-rate";

export type Pair = { from: Currency; to: Currency };

export const pairKey = (from: string, to: string) => `${from}>${to}`;

export type RatesState = {
  quotes: Record<string, RateQuote>;
  loading: boolean;
  errors: Record<string, string>;
  lastAttempt: string | null;
  manualMode: boolean;
  setManualMode: (v: boolean) => void;
  manualRates: Record<string, string>;
  setManualRate: (key: string, rate: string) => void;
  refresh: () => void;
  getQuote: (from: Currency, to: Currency) => RateQuote | null;
  missing: Pair[];
};

export function useRates(requiredPairs: Pair[], token: string | null): RatesState {
  const [quotes, setQuotes] = useState<Record<string, RateQuote>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [manualRates, setManualRates] = useState<Record<string, string>>({});

  const signature = requiredPairs
    .map((p) => pairKey(p.from, p.to))
    .sort()
    .join("|");
  const pairsRef = useRef(requiredPairs);
  pairsRef.current = requiredPairs;

  const load = useCallback(
    async (fresh = false) => {
      const pairs = pairsRef.current.filter((p) => p.from !== p.to);
      if (!pairs.length || !token) return;
      setLoading(true);
      try {
        const fetched = await backend.getRates(token, pairs, { fresh });
        const nextQuotes: Record<string, RateQuote> = {};
        for (const r of fetched) {
          const key = pairKey(r.from, r.to);
          nextQuotes[key] = { ...r, source: "AwesomeAPI" };
        }
        setQuotes((prev) => ({ ...prev, ...nextQuotes }));
        setErrors({});
      } catch (error) {
        const message = friendlyRateError(error);
        setErrors(
          Object.fromEntries(pairs.map((p) => [pairKey(p.from, p.to), message])) as Record<
            string,
            string
          >,
        );
      } finally {
        setLastAttempt(new Date().toISOString());
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!signature) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, token]);

  const setManualRate = useCallback((key: string, rate: string) => {
    setManualRates((prev) => ({ ...prev, [key]: rate }));
  }, []);

  const getQuote = useCallback(
    (from: Currency, to: Currency): RateQuote | null => {
      if (from === to) return null;
      const key = pairKey(from, to);
      if (manualMode) {
        const rate = manualRateForPair(from, to, manualRates[key] ?? "");
        if (!Number.isFinite(rate) || rate <= 0) return null;
        return { from, to, rate, source: "Manual", updatedAt: new Date().toISOString() };
      }
      return quotes[key] ?? null;
    },
    [manualMode, manualRates, quotes],
  );

  const missing = useMemo(
    () => requiredPairs.filter((p) => p.from !== p.to && !getQuote(p.from, p.to)),
    [requiredPairs, getQuote],
  );

  return {
    quotes,
    loading,
    errors,
    lastAttempt,
    manualMode,
    setManualMode,
    manualRates,
    setManualRate,
    refresh: () => void load(true),
    getQuote,
    missing,
  };
}
