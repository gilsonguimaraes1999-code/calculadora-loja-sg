import { useState } from "react";
import { ChevronDown, ChevronUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PercentInput } from "./PercentInput";
import { CURRENCIES, type Currency } from "@/lib/domain/types";
import { cityRecomposicao, type CityDraft } from "@/lib/domain/city-rules";
import { formatPercent } from "@/lib/domain/format";
import { cn } from "@/lib/utils";

type Props = {
  cities: CityDraft[];
  changedIds: string[];
  onChange(city: CityDraft): void;
  onRemove(id: string): void;
  onMove(id: string, direction: "up" | "down"): void;
  onReset(): void;
};
const slug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || `cidade-${Date.now()}`;
const numberValue = (value: string) => Number(value.replace(",", "."));

function Recomposition({ discount }: { discount: number }) {
  return (
    <div>
      <span className="label-gold">Recomposição automática</span>
      <div className="flex h-10 items-center rounded-md border border-primary/20 bg-primary/[0.05] px-3 text-sm font-semibold text-gold-soft">
        {formatPercent(cityRecomposicao({ desconto: discount }))}
      </div>
    </div>
  );
}

function CityRow({
  city,
  changed,
  first,
  last,
  onChange,
  onRemove,
  onMove,
}: {
  city: CityDraft;
  changed: boolean;
  first: boolean;
  last: boolean;
  onChange(city: CityDraft): void;
  onRemove(id: string): void;
  onMove(id: string, direction: "up" | "down"): void;
}) {
  const parsedDiscount = numberValue(city.desconto);
  return (
    <div
      className={cn(
        "grid gap-3 rounded-md border p-4 transition-colors md:grid-cols-2 xl:grid-cols-[minmax(12rem,1.25fr)_minmax(6rem,0.65fr)_minmax(9rem,0.75fr)_minmax(14rem,0.9fr)_minmax(10rem,0.75fr)_minmax(7rem,auto)]",
        changed
          ? "border-primary/75 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.18)]"
          : "border-border/60 bg-secondary/30",
      )}
    >
      <div>
        <span className="label-gold">Nome</span>
        <Input value={city.nome} onChange={(e) => onChange({ ...city, nome: e.target.value })} />
      </div>
      <div>
        <span className="label-gold">Moeda</span>
        <Select
          value={city.moeda}
          onValueChange={(value) => onChange({ ...city, moeda: value as Currency })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((currency) => (
              <SelectItem key={currency} value={currency}>
                {currency}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <PercentInput
        label="Desconto %"
        value={city.desconto}
        onChange={(value) => onChange({ ...city, desconto: value })}
      />
      <Recomposition discount={Number.isFinite(parsedDiscount) ? parsedDiscount : 0} />
      <PercentInput
        label="Multiplicador TEBEX"
        value={city.tebexMultiplier}
        onChange={(value) => onChange({ ...city, tebexMultiplier: value })}
        placeholder="×1"
      />
      <div className="flex items-end justify-end gap-2 whitespace-nowrap">
        {changed && (
          <span className="rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-xs font-semibold text-gold-soft">
            Alterada
          </span>
        )}
        <div className="flex flex-col items-center justify-center">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-5 w-6 rounded-none p-0 text-gold hover:bg-transparent hover:text-primary disabled:opacity-25"
            onClick={() => onMove(city.id, "up")}
            disabled={first}
            aria-label={`Mover ${city.nome} para cima`}
          >
            <ChevronUp className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-5 w-6 rounded-none p-0 text-gold hover:bg-transparent hover:text-primary disabled:opacity-25"
            onClick={() => onMove(city.id, "down")}
            disabled={last}
            aria-label={`Mover ${city.nome} para baixo`}
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => onRemove(city.id)}
          aria-label={`Remover ${city.nome}`}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}

export function CitySettings({ cities, changedIds, onChange, onRemove, onMove, onReset }: Props) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<Currency>("BRL");
  const [discount, setDiscount] = useState("");
  const [multiplier, setMultiplier] = useState("");
  const [message, setMessage] = useState("");
  const parsedDiscount = numberValue(discount);
  function add() {
    if (
      !name.trim() ||
      !Number.isFinite(parsedDiscount) ||
      parsedDiscount < 0 ||
      parsedDiscount >= 100
    ) {
      setMessage("Informe nome e desconto válido.");
      return;
    }
    onChange({
      id: slug(name),
      nome: name.trim(),
      moeda: currency,
      desconto: discount,
      tebexMultiplier: multiplier,
    });
    setName("");
    setDiscount("");
    setMultiplier("");
    setMessage("Cidade adicionada.");
  }
  return (
    <section className="panel-gold space-y-5 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="whitespace-nowrap text-xl font-semibold text-gold">
            Configurações de cidades
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            A recomposição é calculada automaticamente. O multiplicador TEBEX é individual; vazio
            significa ×1.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onReset}>
          <RotateCcw />
          Restaurar padrão
        </Button>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/35 p-4">
        <span className="label-gold">Adicionar nova cidade</span>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(12rem,1.25fr)_minmax(6rem,0.65fr)_minmax(9rem,0.75fr)_minmax(14rem,0.9fr)_minmax(10rem,0.75fr)]">
          <div>
            <span className="label-gold">Nome da cidade</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Liberty"
            />
          </div>
          <div>
            <span className="label-gold">Moeda</span>
            <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CURRENCIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <PercentInput label="Desconto %" value={discount} onChange={setDiscount} />
          <Recomposition discount={Number.isFinite(parsedDiscount) ? parsedDiscount : 0} />
          <PercentInput
            label="Multiplicador TEBEX"
            value={multiplier}
            onChange={setMultiplier}
            placeholder="×1"
          />
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Button onClick={add}>
            <Plus />
            Adicionar cidade
          </Button>
          {message && <span className="text-xs text-gold-soft">{message}</span>}
        </div>
      </div>
      <div className="space-y-3">
        <span className="label-gold">Cidades cadastradas</span>
        {cities.map((city, index) => (
          <CityRow
            key={city.id}
            city={city}
            changed={changedIds.includes(city.id)}
            first={index === 0}
            last={index === cities.length - 1}
            onChange={onChange}
            onRemove={onRemove}
            onMove={onMove}
          />
        ))}
      </div>
    </section>
  );
}
