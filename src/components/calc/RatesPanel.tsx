import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { formatDateTime } from "@/lib/domain/format";
import { pairKey, type RatesState, type Pair } from "@/lib/domain/useRates";
import { manualRateInput } from "@/lib/domain/manual-rate";

type Props = { rates: RatesState; pairs: Pair[] };

export function RatesPanel({ rates, pairs }: Props) {
  const usedPairs = pairs.filter((p) => p.from !== p.to);
  const indisponivel =
    !rates.manualMode && usedPairs.some((p) => rates.errors[pairKey(p.from, p.to)]);

  return (
    <section className="panel-gold p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="label-gold">Cotação · AwesomeAPI</span>
          <p className="text-[0.7rem] text-muted-foreground">
            {rates.lastAttempt
              ? `Atualizada: ${formatDateTime(rates.lastAttempt)}`
              : "Aguardando consulta"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
            <Switch checked={rates.manualMode} onCheckedChange={rates.setManualMode} />
            Manual
          </label>
          <Button variant="outline" size="sm" onClick={rates.refresh} disabled={rates.loading}>
            <RefreshCw className={rates.loading ? "animate-spin" : ""} />
            Atualizar
          </Button>
        </div>
      </div>

      {indisponivel ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-gold/25 bg-gold/5 p-3 text-xs text-muted-foreground">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-gold" />
          <span>Cotação indisponível. Atualize ou utilize o modo manual.</span>
        </div>
      ) : null}

      {usedPairs.length === 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Nenhuma conversão de moeda necessária neste cálculo.
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {usedPairs.map((p) => {
            const key = pairKey(p.from, p.to);
            const quote = rates.getQuote(p.from, p.to);
            const hasError = Boolean(rates.errors[key]);
            const manualInput = manualRateInput(p.from, p.to);
            const shownFrom = rates.manualMode ? manualInput.from : p.from;
            const shownTo = rates.manualMode ? manualInput.to : p.to;
            return (
              <div key={key} className="rounded-md border border-border/60 bg-secondary/35 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="label-gold">
                    {shownFrom} → {shownTo}
                  </span>
                  <span className="text-[0.6rem] tracking-widest text-muted-foreground uppercase">
                    {quote ? quote.source : hasError ? "Indisponível" : "Consultando…"}
                  </span>
                </div>
                {rates.manualMode ? (
                  <Input
                    className="mt-2 h-9"
                    inputMode="decimal"
                    placeholder={`1 ${manualInput.from} = ? ${manualInput.to}`}
                    value={rates.manualRates[key] ?? ""}
                    onChange={(e) =>
                      rates.setManualRate(key, e.target.value.replace(/[^0-9,.]/g, ""))
                    }
                  />
                ) : (
                  <p className="display-num mt-1 whitespace-nowrap text-xl">
                    {quote ? `1 ${p.from} = ${quote.rate.toFixed(6)} ${p.to}` : "—"}
                  </p>
                )}
                {rates.manualMode && manualInput.inverted ? (
                  <p className="mt-2 text-[0.65rem] text-muted-foreground">
                    Informe quantos {manualInput.to} equivalem a 1 {manualInput.from}. Ex.: 5,14.
                  </p>
                ) : null}
                {quote?.url ? (
                  <a
                    className="mt-1 block text-[0.65rem] text-muted-foreground underline underline-offset-2"
                    href={quote.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    AwesomeAPI · {formatDateTime(quote.updatedAt)}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
