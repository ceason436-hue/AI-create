import { z } from "zod";

export const aiToolCreditCostsSchema = z.object({
  chat: z.number().int().min(0).max(10_000),
  code: z.number().int().min(0).max(10_000),
  image: z.number().int().min(0).max(10_000),
  music: z.number().int().min(0).max(10_000),
  music_query: z.number().int().min(0).max(10_000),
  vision: z.number().int().min(0).max(10_000),
});

export type AiToolCreditCosts = z.infer<typeof aiToolCreditCostsSchema>;
