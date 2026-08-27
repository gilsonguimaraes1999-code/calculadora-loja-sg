import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { City } from "@/lib/domain/types";

export function CitySelect({
  cities,
  value,
  onChange,
}: {
  cities: City[];
  value: string;
  onChange: (id: string) => void;
}) {
  const hasCities = cities.length > 0;
  return (
    <Select value={hasCities ? value : undefined} onValueChange={onChange} disabled={!hasCities}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={hasCities ? "Selecione a cidade" : "Nenhuma cidade cadastrada"} />
      </SelectTrigger>
      <SelectContent>
        {cities.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.nome} ({c.moeda})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
