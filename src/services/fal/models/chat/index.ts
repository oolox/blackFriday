import type { ChatModelConfig } from '../chatTypes';
import { deepseekV4Flash, DEEPSEEK_V4_FLASH_ID } from './deepseekV4Flash';

export type { ChatModelConfig, ChatModelCost } from '../chatTypes';
export { deepseekV4Flash, DEEPSEEK_V4_FLASH_ID } from './deepseekV4Flash';

export const DEFAULT_CHAT_MODEL_ID = DEEPSEEK_V4_FLASH_ID;

const CHAT_MODELS: Record<string, ChatModelConfig> = {
  [DEEPSEEK_V4_FLASH_ID]: deepseekV4Flash,
};

/** Resolve the layout model. Flash is the only registered id. */
export function getChatModel(modelId: string = DEFAULT_CHAT_MODEL_ID): ChatModelConfig {
  const model = CHAT_MODELS[modelId];
  if (!model) {
    throw new Error(`Unknown chat model: ${modelId}`);
  }
  return model;
}
