import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/domain/format";
import type { CalcResult } from "@/lib/domain/types";

type Props = {
  result: CalcResult | null;
  manual: boolean;
  erro?: string | null;
  waitingForRate?: boolean;
};

function BigCard({
  titulo,
  subtitulo,
  valor,
}: {
  titulo: string;
  subtitulo: string;
  valor: string;
}) {
  const valueSize =
    valor.length > 13
      ? "text-3xl md:text-4xl"
      : valor.length > 10
        ? "text-4xl"
        : "text-4xl md:text-5xl";
  return (
    <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/[0.06] to-primary/[0.02] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <span className="label-gold">{titulo}</span>
      <span className={`display-num mt-2 block whitespace-nowrap leading-none ${valueSize}`}>
        {valor}
      </span>
      <span className="mt-2 block text-[0.7rem] text-muted-foreground">{subtitulo}</span>
    </div>
  );
}

export function ResultCards({ result, manual, erro, waitingForRate = false }: Props) {
  return (
    <section className="panel-gold p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="label-gold">Resultado</span>
          <h2 className="font-display whitespace-nowrap text-sm tracking-[0.12em] text-foreground uppercase sm:text-lg md:text-xl">
            Cadastre exatamente assim
          </h2>
        </div>
        {manual ? (
          <Badge className="bg-accent text-accent-foreground uppercase">Cotação manual</Badge>
        ) : null}
      </div>

      {waitingForRate ? (
        <div className="rounded-md border border-gold/25 bg-gold/5 p-5 text-sm text-muted-foreground">
          Aguardando cotação. Atualize ou utilize o modo manual.
        </div>
      ) : erro ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {erro}
        </div>
      ) : result ? (
        <div className="grid gap-3 2xl:grid-cols-2">
          <BigCard
            titulo="HUB"
            subtitulo="Valor para cadastrar no HUB"
            valor={formatMoney(result.hub, result.moeda)}
          />
          <BigCard
            titulo="TEBEX"
            subtitulo="Valor para cadastrar na TEBEX"
            valor={formatMoney(result.tebex, result.tebexMoeda)}
          />
        </div>
      ) : (
        <div className="rounded-md border border-border/50 bg-secondary/30 p-5 text-sm text-muted-foreground">
          Preencha os campos ao lado para calcular.
        </div>
      )}
    </section>
  );
}
