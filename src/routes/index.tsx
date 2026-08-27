import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CitySelect } from "@/components/calc/CitySelect";
import { CurrencySelect } from "@/components/calc/CurrencySelect";
import { Field } from "@/components/calc/Field";
import { OptionsBar } from "@/components/calc/OptionsBar";
import { RatesPanel } from "@/components/calc/RatesPanel";
import { ResultCards } from "@/components/calc/ResultCards";
import { RuleBlock } from "@/components/calc/RuleBlock";
import { calcModoA, calcModoB, calcModoC } from "@/lib/domain/calc";
import { inputCurrencyForMode, normalizeCities } from "@/lib/domain/city-rules";
import { normalizeCitySelections } from "@/lib/domain/city-selection";
import { friendlyRateError } from "@/lib/domain/rate-errors.mjs";
import { useRates, type Pair } from "@/lib/domain/useRates";
import type { CalcOptions, CalcResult, City, Currency } from "@/lib/domain/types";
import { backend } from "@/lib/backend/client";
import { useAuth } from "@/lib/auth/AuthProvider";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
});

type Modo = "A" | "B" | "C";
const modeHelp: Record<Modo, { title: string; text: string; example: string }> = {
  A: {
    title: "Use quando você tem um preço-base do produto",
    text: "Você informa o valor na moeda configurada da cidade. A calculadora aplica a recomposição e entrega os valores para HUB e TEBEX.",
    example: "Ex.: o produto tem preço-base de R$ 500 e você quer cadastrar na KNG.",
  },
  B: {
    title: "Use quando você já sabe quanto o cliente precisa pagar no final",
    text: "A calculadora faz a conta inversa do desconto da cidade para descobrir qual valor deve ser cadastrado no HUB e depois calcula a TEBEX.",
    example: "Ex.: depois do desconto, o cliente precisa pagar exatamente £142,80.",
  },
  C: {
    title: "Use para copiar um produto de uma cidade para outra",
    text: "A calculadora remove a regra da cidade de origem, converte a moeda se necessário e aplica a regra da cidade de destino.",
    example: "Ex.: custa £170 na KNG e você quer descobrir quanto deve custar na Royal.",
  },
};

export function CalculatorDashboard() {
  const { token } = useAuth();
  const [cities, setCities] = useState<City[]>([]);
  const [modo, setModo] = useState<Modo>("A");
  const [options, setOptions] = useState<CalcOptions>({
    arredondar: true,
    tebexMultiplier: null,
  });
  const [valor, setValor] = useState("170");
  const [moedaOrigem, setMoedaOrigem] = useState<Currency>("GBP");
  const [cidadeId, setCidadeId] = useState("");
  const [origemId, setOrigemId] = useState("");
  const [destinoId, setDestinoId] = useState("");
  useEffect(() => {
    if (token)
      backend
        .getConfig(token)
        .then((config) => {
          setCities(normalizeCities(config.cities));
        })
        .catch(() => undefined);
  }, [token]);

  useEffect(() => {
    const next = normalizeCitySelections(cities, {
      cityId: cidadeId,
      originId: origemId,
      destinationId: destinoId,
    });
    setCidadeId(next.cityId);
    setOrigemId(next.originId);
    setDestinoId(next.destinationId);
  }, [cities, cidadeId, origemId, destinoId]);

  const cidade = cities.find((c) => c.id === cidadeId) ?? cities[0];
  const origem = cities.find((c) => c.id === origemId) ?? cities[0];
  const destino = cities.find((c) => c.id === destinoId) ?? cities[1] ?? cities[0];
  const inputCurrency = cidade
    ? inputCurrencyForMode(modo, cidade.moeda, moedaOrigem)
    : moedaOrigem;
  const resultCity = modo === "C" ? destino : cidade;
  const effectiveOptions: CalcOptions = {
    ...options,
    tebexMultiplier: resultCity?.tebexMultiplier ?? null,
  };
  const pairs: Pair[] = useMemo(() => {
    const required: Pair[] = [];
    const outputCurrency = modo === "C" ? destino?.moeda : cidade?.moeda;
    if (modo === "C" && origem && destino && origem.moeda !== destino.moeda)
      required.push({ from: origem.moeda, to: destino.moeda });
    if (modo !== "C" && cidade && inputCurrency !== cidade.moeda)
      required.push({ from: inputCurrency, to: cidade.moeda });
    if (outputCurrency === "BRL") required.push({ from: "BRL", to: "USD" });
    return required.filter(
      (pair, index) =>
        required.findIndex((item) => item.from === pair.from && item.to === pair.to) === index,
    );
  }, [modo, origem, destino, cidade, inputCurrency]);
  const rates = useRates(pairs, token);
  const convert = useMemo(
    () => (value: number, from: Currency, to: Currency) => {
      if (from === to) return { value };
      const quote = rates.getQuote(from, to);
      if (!quote) throw new Error(`Cotação ${from}→${to} indisponível`);
      return { value: value * quote.rate, quote };
    },
    [rates],
  );

  const numero = Number(valor.replace(",", "."));
  let result: CalcResult | null = null;
  let erro: string | null = null;
  const waitingForRate = !rates.manualMode && rates.missing.length > 0;
  const cidadesUsadas: City[] = (modo === "C" ? [origem, destino] : [cidade]).filter(
    (c): c is City => Boolean(c),
  );
  try {
    if (!cities.length) erro = "Nenhuma cidade cadastrada. Adicione uma cidade em Configurações.";
    else if (!Number.isFinite(numero) || numero <= 0)
      erro = "Informe um valor numérico maior que zero.";
    else if (waitingForRate) result = null;
    else if (modo === "A" && cidade)
      result = calcModoA({
        precoOriginal: numero,
        moedaOrigem: inputCurrency,
        cidade,
        options: effectiveOptions,
        convert,
      });
    else if (modo === "B" && cidade)
      result = calcModoB({
        valorFinalCliente: numero,
        moedaOrigem: inputCurrency,
        cidade,
        options: effectiveOptions,
        convert,
      });
    else if (modo === "C" && origem && destino)
      result = calcModoC({
        precoOrigem: numero,
        origem,
        destino,
        options: effectiveOptions,
        convert,
      });
  } catch (e) {
    erro = friendlyRateError(e);
  }
  if (result) result.manual = rates.manualMode;
  const help = modeHelp[modo];

  return (
    <>
      <div>
        <div className="grid items-start gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="panel-gold p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CircleHelp className="size-4 text-gold" />O que você precisa fazer?
            </div>
            <Tabs value={modo} onValueChange={(v) => setModo(v as Modo)}>
              <TabsList className="grid h-auto w-full grid-cols-3 gap-1 bg-secondary/50 p-1">
                <TabsTrigger value="A">Preço-base</TabsTrigger>
                <TabsTrigger value="B">Valor final</TabsTrigger>
                <TabsTrigger value="C">Entre cidades</TabsTrigger>
              </TabsList>
              <div className="mt-3 rounded-md border border-border/60 bg-background/35 p-3">
                <p className="text-sm font-semibold">{help.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{help.text}</p>
                <p className="mt-2 text-xs text-gold-soft">{help.example}</p>
              </div>
              <TabsContent value="A" className="mt-4 space-y-4">
                <Field label="Preço-base do produto">
                  <Input value={valor} onChange={(e) => setValor(e.target.value)} />
                </Field>
                <Field label="Cidade onde será cadastrado">
                  <CitySelect cities={cities} value={cidadeId} onChange={setCidadeId} />
                </Field>
              </TabsContent>
              <TabsContent value="B" className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
                  <Field label="Valor final que o cliente deve pagar">
                    <Input value={valor} onChange={(e) => setValor(e.target.value)} />
                  </Field>
                  <Field label="Moeda do valor final">
                    <CurrencySelect value={moedaOrigem} onChange={setMoedaOrigem} />
                  </Field>
                </div>
                <Field label="Cidade">
                  <CitySelect cities={cities} value={cidadeId} onChange={setCidadeId} />
                </Field>
              </TabsContent>
              <TabsContent value="C" className="mt-4 space-y-4">
                <Field label="Preço atual na cidade de origem">
                  <Input value={valor} onChange={(e) => setValor(e.target.value)} />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Cidade de origem">
                    <CitySelect cities={cities} value={origemId} onChange={setOrigemId} />
                  </Field>
                  <Field label="Cidade de destino">
                    <CitySelect cities={cities} value={destinoId} onChange={setDestinoId} />
                  </Field>
                </div>
              </TabsContent>
            </Tabs>
            <div className="mt-5 border-t border-border/50 pt-4">
              <OptionsBar options={options} onChange={setOptions} />
            </div>
          </section>
          <div className="space-y-4">
            <ResultCards
              result={result}
              manual={rates.manualMode}
              erro={erro}
              waitingForRate={waitingForRate}
            />
            <RatesPanel rates={rates} pairs={pairs} />
          </div>
        </div>
        <details className="panel-gold mt-5 group">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium">
            <div className="flex justify-between">
              <span>Ver cálculo detalhado e regra utilizada</span>
              <span className="text-gold">⌄</span>
            </div>
          </summary>
          <div className="border-t border-border/50 p-4 pt-5">
            <RuleBlock result={result} cidades={cidadesUsadas} options={effectiveOptions} />
          </div>
        </details>
      </div>
    </>
  );
}
