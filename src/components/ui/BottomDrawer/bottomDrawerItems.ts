import type { ImageAspectRatio } from '../../../types/aspectRatio';
import type { SessionDocument } from '../../../types/session';

export type BottomDrawerTagRole = 'ref' | 'start' | 'end' | 'source';

export interface BottomDrawerItem {
  key: string;
  imageId: string;
  role?: BottomDrawerTagRole;
  /** Defaults to image; audio refs use the audio-file icon. */
  kind?: 'image' | 'audio';
  thumbUrl?: string;
  aspect?: ImageAspectRatio;
  /** Native pixel width when known (drawer thumbs fit within scale box). */
  width?: number;
  /** Native pixel height when known. */
  height?: number;
  label: string;
  /** Audio refs: duration for the drawer caption (`m:ss`). */
  durationMs?: number;
}

export interface GeneratorDropContext {
  imageActive: boolean;
  videoActive: boolean;
  isRefMode: boolean;
  /** IMG INP — single source image tag. */
  isInpaintMode: boolean;
  isRefs: boolean;
  showsEndFrame: boolean;
}

/** Pick ref / start / end / source for a generator drop, or undefined when no role applies. */
export function resolveGeneratorDropRole(
  session: SessionDocument,
  context: GeneratorDropContext,
): BottomDrawerTagRole | undefined {
  if (context.imageActive && context.isInpaintMode) {
    return 'source';
  }
  if (context.imageActive && context.isRefMode) {
    return 'ref';
  }
  if (context.videoActive && context.isRefs) {
    return 'ref';
  }
  if (context.videoActive && !context.isRefs) {
    if (!session.tags.startImageId) {
      return 'start';
    }
    if (context.showsEndFrame && !session.tags.endImageId) {
      return 'end';
    }
    return 'start';
  }
  return undefined;
}

export function buildBottomDrawerItems(
  session: SessionDocument,
  thumbUrls: Record<string, string | undefined>,
  stagingImageIds: string[] = [],
): BottomDrawerItem[] {
  const images = session.assets.images ?? [];
  const imageById = new Map(images.map((image) => [image.id, image]));
  const items: BottomDrawerItem[] = [];
  const seen = new Set<string>();

  const pushItem = (
    imageId: string,
    role: BottomDrawerTagRole | undefined,
    label: string,
    keyPrefix: string,
  ) => {
    if (seen.has(imageId)) {
      return;
    }
    const image = imageById.get(imageId);
    if (!image) {
      return;
    }
    seen.add(imageId);
    items.push({
      key: `${keyPrefix}:${imageId}`,
      imageId,
      role,
      thumbUrl: thumbUrls[imageId],
      aspect: image.metadata?.aspect,
      width: image.metadata?.width,
      height: image.metadata?.height,
      label,
    });
  };

  if (session.tags.inpaintSourceImageId) {
    pushItem(session.tags.inpaintSourceImageId, 'source', 'Source image', 'source');
  }
  if (session.tags.startImageId) {
    pushItem(session.tags.startImageId, 'start', 'Start frame', 'start');
  }
  if (session.tags.endImageId) {
    pushItem(session.tags.endImageId, 'end', 'End frame', 'end');
  }
  for (const refId of session.tags.refImageIds ?? []) {
    pushItem(refId, 'ref', 'Reference image', 'ref');
  }
  for (const audioId of session.tags.refAudioIds ?? []) {
    if (seen.has(audioId)) {
      continue;
    }
    const audio = (session.assets.audios ?? []).find((entry) => entry.id === audioId);
    if (!audio) {
      continue;
    }
    seen.add(audioId);
    items.push({
      key: `audio-ref:${audioId}`,
      imageId: audioId,
      role: 'ref',
      kind: 'audio',
      label: audio.metadata?.originalName || 'Reference audio',
      durationMs: audio.metadata?.durationMs,
    });
  }
  for (const imageId of stagingImageIds) {
    pushItem(imageId, undefined, 'Gallery image', 'staging');
  }

  return items;
}

export function bottomDrawerRoleLabel(role: BottomDrawerTagRole): string {
  if (role === 'ref') {
    return 'REF';
  }
  if (role === 'source') {
    return 'SRC';
  }
  if (role === 'start') {
    return 'STR';
  }
  return 'END';
}
