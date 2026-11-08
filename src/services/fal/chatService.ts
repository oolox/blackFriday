import { DEFAULT_CHAT_MODEL_ID, getChatModel } from './models/chat';
import { falFetch } from './falClient';

/** fal OpenRouter OpenAI-compatible chat completions (SSE). */
export const FAL_CHAT_COMPLETIONS_URL =
  'https://fal.run/openrouter/router/openai/v1/chat/completions';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamCompletionOptions {
  messages: ChatMessage[];
  onChunk: (contentDelta: string) => void;
  /** Thinking-channel text. The layout parser does not use this. */
  onReasoning?: (reasoningDelta: string) => void;
  onDone: () => void;
  onError: (error: Error) => void;
  signal?: AbortSignal;
  model?: string;
  thinking?: boolean;
  maxTokens?: number;
}

interface ReasoningDetail {
  text?: string;
  summary?: string;
}

interface ChatDelta {
  content?: string;
  reasoning?: string;
  reasoning_content?: string;
  reasoning_details?: ReasoningDetail[];
}

interface ChatCompletionChunk {
  error?: { message?: string } | string;
  choices?: Array<{
    delta?: ChatDelta;
    message?: ChatDelta;
  }>;
}

function reasoningText(delta: ChatDelta): string {
  if (typeof delta.reasoning === 'string' && delta.reasoning !== '') {
    return delta.reasoning;
  }
  if (typeof delta.reasoning_content === 'string' && delta.reasoning_content !== '') {
    return delta.reasoning_content;
  }
  if (!Array.isArray(delta.reasoning_details)) {
    return '';
  }
  return delta.reasoning_details
    .map((detail) => {
      if (typeof detail?.text === 'string') {
        return detail.text;
      }
      if (typeof detail?.summary === 'string') {
        return detail.summary;
      }
      return '';
    })
    .join('');
}

function emitChunk(
  parsed: ChatCompletionChunk,
  onChunk: (contentDelta: string) => void,
  onReasoning: ((reasoningDelta: string) => void) | undefined,
): void {
  if (parsed.error) {
    const message = typeof parsed.error === 'string' ? parsed.error : parsed.error.message;
    throw new Error(message || 'fal API returned an error');
  }
  const choice = parsed.choices?.[0];
  const delta = choice?.delta ?? choice?.message;
  if (!delta) {
    return;
  }
  const reasoning = reasoningText(delta);
  if (reasoning) {
    onReasoning?.(reasoning);
  }
  if (delta.content) {
    onChunk(delta.content);
  }
}

function consumePayload(
  payload: string,
  onChunk: (contentDelta: string) => void,
  onReasoning: ((reasoningDelta: string) => void) | undefined,
): boolean {
  if (payload === '[DONE]') {
    return true;
  }
  let parsed: ChatCompletionChunk;
  try {
    parsed = JSON.parse(payload) as ChatCompletionChunk;
  } catch {
    return false;
  }
  emitChunk(parsed, onChunk, onReasoning);
  return false;
}

async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  onChunk: (contentDelta: string) => void,
  onReasoning: ((reasoningDelta: string) => void) | undefined,
  signal?: AbortSignal,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let raw = '';
  let sawData = false;

  try {
    while (true) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const piece = decoder.decode(value, { stream: true });
      raw += piece;
      buffer += piece;
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) {
          continue;
        }
        sawData = true;
        const payload = trimmed.slice(5).trim();
        if (consumePayload(payload, onChunk, onReasoning)) {
          return;
        }
      }
    }

    const tail = buffer.trim();
    if (tail.startsWith('data:')) {
      sawData = true;
      consumePayload(tail.slice(5).trim(), onChunk, onReasoning);
    } else if (!sawData && raw.trim() !== '') {
      consumePayload(raw.trim(), onChunk, onReasoning);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function streamCompletion({
  messages,
  onChunk,
  onReasoning,
  onDone,
  onError,
  signal,
  model = DEFAULT_CHAT_MODEL_ID,
  thinking,
  maxTokens,
}: StreamCompletionOptions): Promise<void> {
  try {
    const chatModel = getChatModel(model);
    const body: Record<string, unknown> = {
      model: chatModel.modelName,
      messages,
      stream: true,
      response_format: { type: 'text' },
    };
    if (maxTokens !== undefined) {
      body.max_tokens = maxTokens;
    }
    if (thinking === true) {
      body.reasoning_effort = 'high';
      body.thinking = { type: 'enabled' };
    } else if (thinking === false) {
      body.thinking = { type: 'disabled' };
    }

    const response = await falFetch(FAL_CHAT_COMPLETIONS_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      signal,
    });
    if (!response.body) {
      throw new Error('fal API returned an empty response body');
    }
    await consumeSseStream(response.body, onChunk, onReasoning, signal);
    onDone();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      onDone();
      return;
    }
    onError(error instanceof Error ? error : new Error('Stream failed'));
  }
}
