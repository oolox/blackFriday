import { afterEach, describe, expect, it, vi } from 'vitest';
import { FAL_CHAT_COMPLETIONS_URL, streamCompletion } from './chatService';

function sse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, { status: 200 });
}

describe('streamCompletion', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('sends the layout body and keeps only the answer text', async () => {
    vi.stubEnv('VITE_FAL_KEY', 'test-key');
    const fetchMock = vi.fn(async () =>
      sse([
        'data: {"choices":[{"delta":{"reasoning_content":"plan the rooms"}}]}\n',
        'data: {"choices":[{"delta":{"content":"```json"}}]}\n',
        'data: {"choices":[{"delta":{"content":"{}"}}]}\n',
        'data: [DONE]\n',
        'not json\n',
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);
    let text = '';
    let thinking = '';
    await new Promise<void>((resolve, reject) => {
      void streamCompletion({
        messages: [
          { role: 'system', content: 'system' },
          { role: 'user', content: 'user' },
        ],
        reasoning: 'high',
        onChunk: (delta) => {
          text += delta;
        },
        onReasoning: (delta) => {
          thinking += delta;
        },
        onDone: resolve,
        onError: reject,
      });
    });
    expect(text).toBe('```json{}');
    expect(thinking).toBe('plan the rooms');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(FAL_CHAT_COMPLETIONS_URL);
    const headers = new Headers(init.headers);
    expect(headers.get('Authorization')).toBe('Key test-key');
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.model).toBe('deepseek/deepseek-v4-flash');
    expect(body.max_tokens).toBeUndefined();
    expect(body.reasoning_effort).toBe('high');
    expect(body.thinking).toEqual({ type: 'enabled' });
    expect(body.response_format).toEqual({ type: 'text' });
  });

  it('turns thinking off without an effort, and sends max when asked', async () => {
    vi.stubEnv('VITE_FAL_KEY', 'test-key');
    const fetchMock = vi.fn(async () => sse(['data: {"choices":[{"delta":{"content":"ok"}}]}\n', 'data: [DONE]\n']));
    vi.stubGlobal('fetch', fetchMock);
    const run = (reasoning: 'off' | 'max') =>
      new Promise<void>((resolve, reject) => {
        void streamCompletion({
          messages: [{ role: 'user', content: 'layout' }],
          reasoning,
          onChunk: () => undefined,
          onDone: resolve,
          onError: reject,
        });
      });
    await run('off');
    await run('max');
    const bodies = fetchMock.mock.calls.map((call) =>
      JSON.parse(String((call as [string, RequestInit])[1].body)) as Record<string, unknown>,
    );
    expect(bodies[0]?.thinking).toEqual({ type: 'disabled' });
    expect(bodies[0]?.reasoning_effort).toBeUndefined();
    expect(bodies[1]?.thinking).toEqual({ type: 'enabled' });
    expect(bodies[1]?.reasoning_effort).toBe('max');
  });

  it('drops a partial reply when the request is aborted', async () => {
    vi.stubEnv('VITE_FAL_KEY', 'test-key');
    const controller = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        init?.signal?.addEventListener('abort', () => undefined);
        controller.abort();
        throw new DOMException('Aborted', 'AbortError');
      }),
    );
    let done = false;
    let failed = false;
    await streamCompletion({
      messages: [{ role: 'user', content: 'layout' }],
      signal: controller.signal,
      onChunk: () => undefined,
      onDone: () => {
        done = true;
      },
      onError: () => {
        failed = true;
      },
    });
    expect(done).toBe(true);
    expect(failed).toBe(false);
  });

  it('reads OpenRouter reasoning once and a JSON body that is not SSE', async () => {
    vi.stubEnv('VITE_FAL_KEY', 'test-key');
    const openRouter = sse([
      'data: {"choices":[{"delta":{"content":"","reasoning":"plan","reasoning_details":[{"type":"reasoning.text","text":"plan"}]}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"```json{}"}}]}\n\n',
      'data: [DONE]\n\n',
    ]);
    const jsonBody = new Response(
      JSON.stringify({
        choices: [{ message: { reasoning: 'think', content: 'reply' } }],
      }),
      { status: 200 },
    );
    const fetchMock = vi.fn().mockResolvedValueOnce(openRouter).mockResolvedValueOnce(jsonBody);
    vi.stubGlobal('fetch', fetchMock);

    const first = await collect();
    expect(first.thinking).toBe('plan');
    expect(first.text).toBe('```json{}');

    const second = await collect();
    expect(second.thinking).toBe('think');
    expect(second.text).toBe('reply');
  });
});

async function collect(): Promise<{ text: string; thinking: string }> {
  let text = '';
  let thinking = '';
  await streamCompletion({
    messages: [{ role: 'user', content: 'layout' }],
    onChunk: (delta) => {
      text += delta;
    },
    onReasoning: (delta) => {
      thinking += delta;
    },
    onDone: () => undefined,
    onError: (error) => {
      throw error;
    },
  });
  return { text, thinking };
}
