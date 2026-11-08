import { describe, it, expect } from 'vitest';
import {
  buildBottomDrawerItems,
  resolveGeneratorDropRole,
} from './bottomDrawerItems';
import type { SessionDocument } from '../../../types/session';

function sessionWithTags(
  tags: Partial<SessionDocument['tags']>,
): SessionDocument {
  return {
    schemaVersion: 1,
    id: 'sess-1',
    name: 'Test',
    createdAt: '',
    updatedAt: '',
    tags: {
      refImageIds: [],
      bgImageIds: [],
      tileImageIds: [],
      propImageIds: [],
      ...tags,
    },
    assets: {
      images: [
        { id: 'img-start', path: 'a.png' },
        { id: 'img-end', path: 'b.png' },
        { id: 'img-ref', path: 'c.png' },
        { id: 'img-staging', path: 'd.png' },
        { id: 'img-source', path: 'e.png' },
      ],
      videos: [],
      texts: [],
      audios: [
        {
          id: 'aud-ref',
          fileName: 'aud.mp3',
          path: '/luxnova/assets/aud/aud.mp3',
          createdAt: '',
          mimeType: 'audio/mpeg' as const,
          metadata: { originalName: 'theme.mp3', durationMs: 12_400 },
        },
      ],
      refs: [],
    },
    image: {
      prompt: '',
      modelId: '',
      seed: 0,
      seedLocked: false,
      guidanceScale: 0,
      steps: 0,
      aspect: '1:1',
      useNegativePrompt: false,
      transparentBackground: false,
    },
    video: { prompt: '', modelId: '', mode: 'i2v', duration: 5 },
    text: { messages: [] },
    game: {},
    thumbScale: 'md',
  } as SessionDocument;
}

const baseDropContext = {
  imageActive: false,
  videoActive: false,
  isRefMode: false,
  isInpaintMode: false,
  isRefs: false,
  showsEndFrame: false,
};

describe('buildBottomDrawerItems', () => {
  it('orders source, start, end, then refs', () => {
    const items = buildBottomDrawerItems(
      sessionWithTags({
        inpaintSourceImageId: 'img-source',
        startImageId: 'img-start',
        endImageId: 'img-end',
        refImageIds: ['img-ref'],
      }),
      {
        'img-source': 'blob:source',
        'img-start': 'blob:start',
        'img-end': 'blob:end',
        'img-ref': 'blob:ref',
      },
    );

    expect(items.map((item) => item.key)).toEqual([
      'source:img-source',
      'start:img-start',
      'end:img-end',
      'ref:img-ref',
    ]);
  });

  it('appends untagged staging images without role badges', () => {
    const items = buildBottomDrawerItems(
      sessionWithTags({ refImageIds: ['img-ref'] }),
      { 'img-ref': 'blob:ref', 'img-staging': 'blob:staging' },
      ['img-staging'],
    );

    expect(items).toHaveLength(2);
    expect(items[1]).toMatchObject({
      key: 'staging:img-staging',
      imageId: 'img-staging',
      role: undefined,
    });
  });

  it('includes Seedance audio refs after image refs', () => {
    const items = buildBottomDrawerItems(
      sessionWithTags({
        refImageIds: ['img-ref'],
        refAudioIds: ['aud-ref'],
      }),
      { 'img-ref': 'blob:ref' },
    );

    expect(items.map((item) => item.key)).toEqual([
      'ref:img-ref',
      'audio-ref:aud-ref',
    ]);
    expect(items[1]).toMatchObject({
      imageId: 'aud-ref',
      role: 'ref',
      kind: 'audio',
      label: 'theme.mp3',
      durationMs: 12_400,
    });
  });

  it('skips tags for images missing from the gallery', () => {
    const items = buildBottomDrawerItems(
      sessionWithTags({
        startImageId: 'missing',
        refImageIds: ['img-ref', 'also-missing'],
      }),
      { 'img-ref': 'blob:ref' },
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.role).toBe('ref');
  });
});

describe('resolveGeneratorDropRole', () => {
  it('returns source for image inpaint mode', () => {
    expect(
      resolveGeneratorDropRole(sessionWithTags({}), {
        ...baseDropContext,
        imageActive: true,
        isInpaintMode: true,
      }),
    ).toBe('source');
  });

  it('returns ref for image ref mode and video refs mode', () => {
    const session = sessionWithTags({});
    expect(
      resolveGeneratorDropRole(session, {
        ...baseDropContext,
        imageActive: true,
        isRefMode: true,
      }),
    ).toBe('ref');
    expect(
      resolveGeneratorDropRole(session, {
        ...baseDropContext,
        videoActive: true,
        isRefs: true,
      }),
    ).toBe('ref');
  });

  it('fills start then end for video start_end mode', () => {
    const session = sessionWithTags({ startImageId: 'img-start' });
    expect(
      resolveGeneratorDropRole(session, {
        ...baseDropContext,
        videoActive: true,
        showsEndFrame: true,
      }),
    ).toBe('end');
  });

  it('returns undefined for image txt mode', () => {
    expect(
      resolveGeneratorDropRole(sessionWithTags({}), {
        ...baseDropContext,
        imageActive: true,
      }),
    ).toBeUndefined();
  });
});
