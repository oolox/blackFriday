import type { ImageAspectRatio } from '../../../types/aspectRatio';
import {
  THUMB_SCALE_WIDTHS,
  type ThumbScale,
} from '../../../services/thumbScale/thumbScaleService';

/**
 * Square side lengths (px) = thumb box height (`width * 9/16`), ordered xsm → lg.
 * Wide/portrait frames share this as the box height; wide width is the scale width.
 */
export const IMG_CONTAINER_SQUARE_SIDES = [
  Math.round((THUMB_SCALE_WIDTHS.xsm * 9) / 16),
  Math.round((THUMB_SCALE_WIDTHS.sm * 9) / 16),
  Math.round((THUMB_SCALE_WIDTHS.md * 9) / 16),
  Math.round((THUMB_SCALE_WIDTHS.lg * 9) / 16),
] as const;

const SIZE_KEYS = ['xsm', 'sm', 'md', 'lg'] as const satisfies readonly ThumbScale[];

export type ImgContainerAspect = Exclude<ImageAspectRatio, '1:1-512'>;

export type ImgContainerSize =
  | (typeof SIZE_KEYS)[number]
  | `${(typeof SIZE_KEYS)[number]}Wide`
  | `${(typeof SIZE_KEYS)[number]}Portrait`;

export interface ImgContainerSizeDef {
  id: ImgContainerSize;
  width: number;
  height: number;
  aspect: ImgContainerAspect;
}

function portraitWidth(height: number): number {
  return Math.round((height * 9) / 16);
}

/** xsm/sm/md/lg frames from shared 16:9 thumb bounds (128×72 … 1024×576). */
export const IMG_CONTAINER_SIZE_LIST: readonly ImgContainerSizeDef[] =
  SIZE_KEYS.flatMap((key) => {
    const boxWidth = THUMB_SCALE_WIDTHS[key];
    const boxHeight = Math.round((boxWidth * 9) / 16);
    return [
      {
        id: key,
        width: boxHeight,
        height: boxHeight,
        aspect: '1:1' as const,
      },
      {
        id: `${key}Wide` as ImgContainerSize,
        width: boxWidth,
        height: boxHeight,
        aspect: '16:9' as const,
      },
      {
        id: `${key}Portrait` as ImgContainerSize,
        width: portraitWidth(boxHeight),
        height: boxHeight,
        aspect: '9:16' as const,
      },
    ];
  });

export const IMG_CONTAINER_SIZES: Record<ImgContainerSize, ImgContainerSizeDef> =
  Object.fromEntries(IMG_CONTAINER_SIZE_LIST.map((size) => [size.id, size])) as Record<
    ImgContainerSize,
    ImgContainerSizeDef
  >;
