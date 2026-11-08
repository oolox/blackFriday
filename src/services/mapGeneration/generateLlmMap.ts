import type { GeneratedMap } from '../../types/map';
import type { Tile } from '../../types/tile';
import { streamCompletion, type ReasoningEffort } from '../fal/chatService';
import { acceptLayoutFence } from './acceptLayoutFence';
import { layoutSetupPrompt, layoutSystemPrompt } from './layoutPrompt';

export interface LayoutTraceDelta {
  kind: 'reasoning' | 'content';
  text: string;
}

export interface GenerateLlmRequest {
  tiles: readonly Tile[];
  seed: string;
  brief: string;
  reasoning: ReasoningEffort;
  signal?: AbortSignal;
  onTrace?: (delta: LayoutTraceDelta) => void;
}

export async function generateLlmMap(
  request: GenerateLlmRequest,
): Promise<{ ok: true; map: GeneratedMap } | { ok: false; errors: string[] }> {
  let text = '';
  let reasoning = '';
  try {
    await new Promise<void>((resolve, reject) => {
      void streamCompletion({
        messages: [
          { role: 'system', content: layoutSystemPrompt },
          {
            role: 'user',
            content: layoutSetupPrompt(request.seed, request.brief),
          },
        ],
        reasoning: request.reasoning,
        signal: request.signal,
        onChunk: (delta) => {
          text += delta;
          request.onTrace?.({ kind: 'content', text: delta });
        },
        onReasoning: (delta) => {
          reasoning += delta;
          request.onTrace?.({ kind: 'reasoning', text: delta });
        },
        onDone: () => {
          if (request.signal?.aborted) {
            reject(new DOMException('Aborted', 'AbortError'));
            return;
          }
          resolve();
        },
        onError: reject,
      });
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { ok: false, errors: [] };
    }
    const message = error instanceof Error ? error.message : 'Layout request failed';
    return { ok: false, errors: [message] };
  }
  if (text.trim() === '') {
    return {
      ok: false,
      errors: [
        reasoning.trim() === ''
          ? 'layout reply was empty'
          : 'The model sent thinking but no layout reply.',
      ],
    };
  }
  return acceptLayoutFence({
    text,
    seed: request.seed,
    tiles: request.tiles,
    brief: request.brief,
  });
}
