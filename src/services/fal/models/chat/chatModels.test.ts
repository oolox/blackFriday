import { describe, expect, it } from 'vitest';
import { DEFAULT_CHAT_MODEL_ID, getChatModel } from './index';

describe('getChatModel', () => {
  it('defaults to DeepSeek V4 Flash', () => {
    expect(DEFAULT_CHAT_MODEL_ID).toBe('deepseek/deepseek-v4-flash');
    expect(getChatModel().id).toBe(DEFAULT_CHAT_MODEL_ID);
    expect(getChatModel().modelName).toBe(DEFAULT_CHAT_MODEL_ID);
  });
});
