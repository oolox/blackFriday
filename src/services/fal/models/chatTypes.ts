/**
 * LLM pricing (USD per million tokens) — display estimates via OpenRouter on fal.
 */
export type ChatModelCost = {
  inputUsdPerMt: number;
  outputUsdPerMt: number;
  cacheReadUsdPerMt?: number;
};

/**
 * LLM chat model registry entry.
 * `id` is the registry key. `modelName` is the OpenRouter slug sent to fal.
 */
export type ChatModelConfig = {
  id: string;
  label: string;
  modelName: string;
  shortLabel?: string;
  description: string;
  cost: ChatModelCost;
};
