import { ChevronDown, ChevronUp } from "lucide-react";
import { stepPercent } from "@/lib/domain/percent";

export function PercentInput({
  label,
  value,
  onChange,
  step = 0.1,
  placeholder,
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  step?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <span className="label-gold">{label}</span>
      <div className="relative">
        <input
          aria-label={label}
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9,.]/g, ""))}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary/60 focus:ring-2 focus:ring-primary/15"
        />
        <div className="absolute inset-y-px right-px flex w-8 flex-col overflow-hidden rounded-r-md border-l border-primary/20 bg-secondary">
          <button
            type="button"
            aria-label={`Aumentar ${label}`}
            className="grid flex-1 place-items-center text-gold transition-colors hover:bg-primary/15 hover:text-gold-soft"
            onClick={() => onChange(stepPercent(value, step))}
          >
            <ChevronUp className="size-3" />
          </button>
          <button
            type="button"
            aria-label={`Diminuir ${label}`}
            className="grid flex-1 place-items-center border-t border-primary/20 text-gold transition-colors hover:bg-primary/15 hover:text-gold-soft"
            onClick={() => onChange(stepPercent(value, -step))}
          >
            <ChevronDown className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
