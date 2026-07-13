import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { formatConvertedCurrency, formatDateTime } from "@/lib/calculator";

interface CurrencyQuoteProps {
  storeValue: number;
}

interface Currency {
  code: string;
  name: string;
  country: string;
}

const ORIGIN_CURRENCIES: Currency[] = [
  { code: "USD", name: "Dólar Americano", country: "US" },
  { code: "EUR", name: "Euro", country: "EU" },
  { code: "GBP", name: "Libra Esterlina", country: "GB" },
];

const FOOTER_CURRENCIES = [
  { code: "BRL", label: "Real" },
  { code: "USD", label: "Dólar" },
  { code: "GBP", label: "Libra" },
  { code: "EUR", label: "Euro" },
];

interface QuoteData {
  rates: Record<string, number>; // taxa X -> BRL
  updatedAt: string;
}

/**
 * AwesomeAPI (economia.awesomeapi.com.br) — cotações do mercado brasileiro
 * atualizadas a cada minuto (ao contrário de er-api que atualiza 1x ao dia).
 */
async function fetchQuotesToBRL(): Promise<QuoteData> {
  const response = await fetch(
    "https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,GBP-BRL",
    { signal: AbortSignal.timeout(15000), cache: "no-store" },
  );
  if (!response.ok) throw new Error("Não foi possível consultar a cotação.");
  const payload = (await response.json()) as Record<
    string,
    { bid: string; create_date: string; code: string }
  >;

  const rates: Record<string, number> = { BRL: 1 };
  let latest = 0;
  for (const key of Object.keys(payload)) {
    const item = payload[key];
    const bid = Number(item.bid);
    if (Number.isFinite(bid)) rates[item.code] = bid;
    // create_date vem no fuso de São Paulo (-03:00) sem timezone explícito.
    const ts = new Date(item.create_date.replace(" ", "T") + "-03:00").getTime();
    if (ts > latest) latest = ts;
  }

  return {
    rates,
    updatedAt: latest ? new Date(latest).toISOString() : new Date().toISOString(),
  };
}

function CurrencySelect({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const current = ORIGIN_CURRENCIES.find((c) => c.code === value) ?? ORIGIN_CURRENCIES[0];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center gap-3 rounded-md border ${open ? "border-primary/60 shadow-[0_0_0_3px_rgba(212,175,55,0.12)]" : "border-border"} bg-secondary/60 px-3 py-2.5 text-left transition-all hover:border-primary/50`}
      >
        <span className="grid h-8 w-8 place-items-center rounded-md border border-primary/25 bg-primary/10 text-[10px] font-black uppercase tracking-wider text-primary">
          {current.country}
        </span>
        <div className="flex-1 leading-tight">
          <div className="text-sm font-black uppercase text-white">{current.code}</div>
          <div className="text-[10px] text-muted-foreground">{current.name}</div>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`h-4 w-4 text-primary transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-md border border-primary/30 bg-background/95 p-1 shadow-[0_20px_60px_rgba(0,0,0,0.6),0_0_0_1px_rgba(212,175,55,0.08)] backdrop-blur-xl"
        >
          {ORIGIN_CURRENCIES.map((c) => {
            const selected = c.code === value;
            return (
              <li key={c.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    onChange(c.code);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors ${
                    selected
                      ? "bg-primary/15 text-primary"
                      : "text-foreground/90 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <span
                    className={`grid h-7 w-7 place-items-center rounded-md border text-[10px] font-black uppercase tracking-wider ${
                      selected
                        ? "border-primary/60 bg-primary/20 text-primary"
                        : "border-primary/20 bg-primary/10 text-primary/90"
                    }`}
                  >
                    {c.country}
                  </span>
                  <div className="flex-1 leading-tight">
                    <div className="text-sm font-black uppercase">{c.code}</div>
                    <div className="text-[10px] text-muted-foreground">{c.name}</div>
                  </div>
                  {selected && (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-primary"
                      aria-hidden="true"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}


function DestinationBRL() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/60 px-3 py-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-md border border-primary/25 bg-primary/10 text-[10px] font-black uppercase tracking-wider text-primary">
        BR
      </span>
      <div className="flex-1 leading-tight">
        <div className="text-sm font-black uppercase text-white">BRL</div>
        <div className="text-[10px] text-muted-foreground">Real Brasileiro</div>
      </div>
    </div>
  );
}

/** Arredonda para cima na próxima "casa amigável" para exibição. */
function roundUpFriendly(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 1) return Math.ceil(value);
  if (value >= 0.1) return Math.ceil(value * 10) / 10;
  return Math.ceil(value * 100) / 100;
}

export function CurrencyQuote({ storeValue }: CurrencyQuoteProps) {
  const [origin, setOrigin] = useState("USD");

  const { data: quote, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: ["currency-quotes-brl"],
    queryFn: fetchQuotesToBRL,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    refetchOnWindowFocus: true,
    retry: 2,
  });

  const rateOriginToBRL = quote?.rates[origin] ?? 0;
  const consultedAt = dataUpdatedAt
    ? formatDateTime(new Date(dataUpdatedAt))
    : "Aguardando cotação.";
  const quoteAt = quote?.updatedAt ? formatDateTime(quote.updatedAt) : "";

  const error = isError ? "Não foi possível carregar a cotação. Tente atualizar." : "";

  const footerValues = useMemo<Record<string, number>>(() => {
    const rates = quote?.rates;
    // storeValue está em BRL. Converte para X dividindo pela taxa X->BRL.
    return {
      BRL: storeValue,
      USD: rates?.USD ? storeValue / rates.USD : 0,
      GBP: rates?.GBP ? storeValue / rates.GBP : 0,
      EUR: rates?.EUR ? storeValue / rates.EUR : 0,
    };
  }, [storeValue, quote]);

  const roundedValues = useMemo<Record<string, number>>(
    () => ({
      BRL: roundUpFriendly(footerValues.BRL),
      USD: roundUpFriendly(footerValues.USD),
      GBP: roundUpFriendly(footerValues.GBP),
      EUR: roundUpFriendly(footerValues.EUR),
    }),
    [footerValues],
  );

  return (
    <div className="mt-6 space-y-3">
      {/* Faixa superior */}
      <div className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-4 py-3">
        <span className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">Cotação atual</span>
        <span className="text-xs font-black uppercase tracking-[0.22em] text-primary">
          {origin} → BRL
        </span>
      </div>

      {/* Card principal de cotação */}
      <div className="rounded-lg border border-border bg-secondary/40 p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary shadow-[0_0_10px_var(--calculator-orange)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              AwesomeAPI · Tempo real
            </span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-primary transition-all hover:-translate-y-0.5 hover:border-primary/70 hover:bg-primary/15 disabled:opacity-50"
          >
            {isLoading ? "Atualizando..." : "Atualizar cotação"}
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div>
            <div className="mb-1 text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground">
              Origem
            </div>
            <CurrencySelect id="origin" value={origin} onChange={setOrigin} />
          </div>
          <div className="mt-4 grid h-11 w-11 place-items-center rounded-md border border-primary/40 bg-primary/10 text-lg font-black text-primary">
            =
          </div>
          <div>
            <div className="mb-1 text-[9px] font-black uppercase tracking-[0.28em] text-muted-foreground">
              Destino
            </div>
            <DestinationBRL />
          </div>
        </div>

        <p className="mt-4 text-sm font-black text-primary">
          {rateOriginToBRL > 0
            ? `${formatConvertedCurrency(1, origin)} ${origin} = ${formatConvertedCurrency(rateOriginToBRL, "BRL")} BRL`
            : "—"}
        </p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Consultado em {consultedAt}
          {quoteAt && ` · cotação de ${quoteAt}`}
        </p>
        {error && (
          <p className="mt-2 text-xs text-destructive" role="status" aria-live="polite">
            {error}
          </p>
        )}
      </div>

      {/* Rodapé de conversões exatas */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FOOTER_CURRENCIES.map((c) => (
          <div
            key={c.code}
            className="rounded-md border border-border bg-secondary/40 p-3 transition-colors hover:border-primary/40"
          >
            <div className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
              {c.label}
            </div>
            <strong className="mt-1 block text-sm font-black text-white">
              {formatConvertedCurrency(footerValues[c.code], c.code)}
            </strong>
          </div>
        ))}
      </div>

      {/* Rodapé de valores arredondados */}
      <div className="rounded-md border border-primary/25 bg-primary/[0.04] p-3">
        <div className="mb-2 text-[9px] font-black uppercase tracking-[0.28em] text-primary">
          Valor Arredondado (Utilizado na Loja)
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {FOOTER_CURRENCIES.map((c) => (
            <div
              key={c.code}
              className="rounded-md border border-primary/20 bg-secondary/30 p-3 transition-colors hover:border-primary/50"
            >
              <div className="text-[9px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                {c.label}
              </div>
              <strong className="mt-1 block text-sm font-black text-primary">
                {formatConvertedCurrency(roundedValues[c.code], c.code)}
              </strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
