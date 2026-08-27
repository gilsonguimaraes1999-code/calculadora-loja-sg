import { formatDateTime, formatPercent } from "@/lib/domain/format";
import type { CalcResult, CalcOptions, City } from "@/lib/domain/types";
import { cityRecomposicao } from "@/lib/domain/calc";

type Props = {
  result: CalcResult | null;
  cidades: City[];
  options: CalcOptions;
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-md border border-border/60 bg-secondary/40 p-3">
      <span className="label-gold">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}

export function RuleBlock({ result, cidades, options }: Props) {
  if (!result) return null;

  return (
    <section className="panel-gold space-y-5 p-6">
      <h3 className="font-display text-2xl tracking-[0.2em] text-gold uppercase">
        Regra usada no cálculo
      </h3>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cidades.map((cidade, i) => (
          <Item
            key={cidade.id + i}
            label={
              cidades.length > 1 ? (i === 0 ? "Cidade de origem" : "Cidade de destino") : "Cidade"
            }
            value={`${cidade.nome} · ${cidade.moeda} · desconto ${formatPercent(
              cidade.desconto,
            )} · recomposição ${formatPercent(cityRecomposicao(cidade))}`}
          />
        ))}
        <Item
          label="Arredondamento"
          value={options.arredondar ? "Ligado (sempre para cima)" : "Desligado"}
        />
        <Item
          label="Multiplicador TEBEX"
          value={options.tebexMultiplier ? `×${options.tebexMultiplier}` : "×1 (sem multiplicador)"}
        />
        <Item
          label="Cotações utilizadas"
          value={
            result.cotacoes.length
              ? result.cotacoes
                  .map(
                    (q) =>
                      `1 ${q.from} = ${q.rate.toFixed(6)} ${q.to} (${q.source}, ${formatDateTime(
                        q.updatedAt,
                      )})`,
                  )
                  .join(" | ")
              : "Nenhuma conversão necessária"
          }
        />
      </div>

      <div>
        <span className="label-gold">Fórmula passo a passo</span>
        <ol className="mt-3 space-y-2">
          {result.steps.map((step, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-md border border-border/50 bg-background/40 p-3 text-sm"
            >
              <span className="display-num text-lg leading-none">{i + 1}</span>
              <span>
                <span className="block font-medium text-foreground">{step.label}</span>
                <span className="block text-muted-foreground">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
