import { Switch } from "@/components/ui/switch";
import type { CalcOptions } from "@/lib/domain/types";

export function OptionsBar({
  options,
  onChange,
}: {
  options: CalcOptions;
  onChange: (o: CalcOptions) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-md border border-border/60 bg-secondary/30 px-4 py-3">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch
          checked={options.arredondar}
          onCheckedChange={(v) => onChange({ ...options, arredondar: v })}
        />
        Arredondar sempre para cima
      </label>
    </div>
  );
}
