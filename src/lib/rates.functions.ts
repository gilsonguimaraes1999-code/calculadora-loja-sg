import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const pairSchema = z.object({
  pairs: z
    .array(z.object({ from: z.string().length(3), to: z.string().length(3) }))
    .min(1)
    .max(12),
});

export type RatesResponse = {
  results: Array<
    | { from: string; to: string; ok: true; rate: number; url: string; updatedAt: string }
    | { from: string; to: string; ok: false; error: string }
  >;
};

export const fetchRates = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => pairSchema.parse(data))
  .handler(async ({ data }): Promise<RatesResponse> => {
    const { fetchAwesomeRates } = await import("./rates.server");
    const pairs = data.pairs.map((pair) => ({
      from: pair.from.toUpperCase(),
      to: pair.to.toUpperCase(),
    }));

    try {
      const fetched = await fetchAwesomeRates(pairs);
      return {
        results: fetched.map((rate) => ({
          ...rate,
          ok: true as const,
        })),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha desconhecida";
      return {
        results: pairs.map((pair) => ({ ...pair, ok: false as const, error: message })),
      };
    }
  });
