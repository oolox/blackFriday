import type { ButtonToggleValue } from '../ButtonToggle';
import type { ImageAspectRatio } from '../../../types/aspectRatio';
import { DEFAULT_IMAGE_ASPECT_RATIO } from '../../../utils/aspectRatio';
import {
  thumbBoundsForScale,
  type ThumbScale,
} from '../../../services/thumbScale/thumbScaleService';
import type { ImgContainerSize } from './imgContainerSizes';

/** Gallery / assets list thumb scale (gallery UI is typically sm ↔ md; library uses xsm ↔ sm). */
export type GalleryThumbScale = ThumbScale;

/** Toggle index: 0 = square 1024, 1 = wide 16:9, 2 = portrait 9:16, 3 = square 512 */
const ASPECT_SQUARE: ButtonToggleValue = 0;
const ASPECT_WIDE: ButtonToggleValue = 1;
const ASPECT_PORTRAIT: ButtonToggleValue = 2;
const ASPECT_SQUARE_SM: ButtonToggleValue = 3;

const ASPECT_INDEX: Record<ImageAspectRatio, ButtonToggleValue> = {
  '1:1': ASPECT_SQUARE,
  '16:9': ASPECT_WIDE,
  '9:16': ASPECT_PORTRAIT,
  '1:1-512': ASPECT_SQUARE_SM,
};

const SCALE_PREVIEW_SIZE: Record<
  GalleryThumbScale,
  Record<ButtonToggleValue, ImgContainerSize>
> = {
  xsm: {
    [ASPECT_SQUARE]: 'xsm',
    [ASPECT_WIDE]: 'xsmWide',
    [ASPECT_PORTRAIT]: 'xsmPortrait',
    [ASPECT_SQUARE_SM]: 'xsm',
  },
  sm: {
    [ASPECT_SQUARE]: 'sm',
    [ASPECT_WIDE]: 'smWide',
    [ASPECT_PORTRAIT]: 'smPortrait',
    [ASPECT_SQUARE_SM]: 'sm',
  },
  md: {
    [ASPECT_SQUARE]: 'md',
    [ASPECT_WIDE]: 'mdWide',
    [ASPECT_PORTRAIT]: 'mdPortrait',
    [ASPECT_SQUARE_SM]: 'md',
  },
  lg: {
    [ASPECT_SQUARE]: 'lg',
    [ASPECT_WIDE]: 'lgWide',
    [ASPECT_PORTRAIT]: 'lgPortrait',
    [ASPECT_SQUARE_SM]: 'lg',
  },
};

/** Generator placeholder / player uses `md` container sizes. */
export const ASPECT_PREVIEW_SIZE: Record<ButtonToggleValue, ImgContainerSize> = {
  [ASPECT_SQUARE]: 'md',
  [ASPECT_WIDE]: 'mdWide',
  [ASPECT_PORTRAIT]: 'mdPortrait',
  [ASPECT_SQUARE_SM]: 'md',
};

/** Bounding-box height (px) for a gallery thumb scale. */
export function galleryThumbBaseHeight(scale: GalleryThumbScale = 'md'): number {
  return thumbBoundsForScale(scale).height;
}

/** Library asset list thumbs always use extra-small (128×72). */
export const LIBRARY_ASSET_THUMB_SCALE: ThumbScale = 'xsm';

/** @deprecated Prefer {@link scalePixelsToThumb} with an explicit scale. */
export const LIBRARY_ASSET_THUMB_MAX_SIDE = thumbBoundsForScale(LIBRARY_ASSET_THUMB_SCALE).width;

/** Map a saved aspect string to an ImgContainer size. */
export function aspectToImgContainerSize(
  aspect: ImageAspectRatio | undefined,
  scale: GalleryThumbScale = 'md',
): ImgContainerSize {
  if (!aspect) {
    const index = ASPECT_INDEX[DEFAULT_IMAGE_ASPECT_RATIO];
    return SCALE_PREVIEW_SIZE[scale][index];
  }
  return SCALE_PREVIEW_SIZE[scale][ASPECT_INDEX[aspect]] ?? (scale === 'xsm' ? 'xsm' : 'sm');
}
