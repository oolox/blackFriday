import { describe, it, expect } from 'vitest';
import {
  IMG_CONTAINER_SIZE_LIST,
  IMG_CONTAINER_SIZES,
  IMG_CONTAINER_SQUARE_SIDES,
} from './imgContainerSizes';

describe('imgContainerSizes', () => {
  it('defines square xsm/sm/md/lg from thumb box heights (width * 9/16)', () => {
    expect(IMG_CONTAINER_SQUARE_SIDES).toEqual([72, 144, 288, 576]);
    expect(IMG_CONTAINER_SIZES.xsm).toMatchObject({
      width: 72,
      height: 72,
      aspect: '1:1',
    });
    expect(IMG_CONTAINER_SIZES.sm).toMatchObject({
      width: 144,
      height: 144,
      aspect: '1:1',
    });
    expect(IMG_CONTAINER_SIZES.md).toMatchObject({
      width: 288,
      height: 288,
      aspect: '1:1',
    });
    expect(IMG_CONTAINER_SIZES.lg).toMatchObject({
      width: 576,
      height: 576,
      aspect: '1:1',
    });
  });

  it('defines 16:9 wide sizes as the full thumb bounding boxes', () => {
    expect(IMG_CONTAINER_SIZES.xsmWide).toMatchObject({
      width: 128,
      height: 72,
      aspect: '16:9',
    });
    expect(IMG_CONTAINER_SIZES.smWide).toMatchObject({
      width: 256,
      height: 144,
      aspect: '16:9',
    });
    expect(IMG_CONTAINER_SIZES.mdWide).toMatchObject({
      width: 512,
      height: 288,
      aspect: '16:9',
    });
    expect(IMG_CONTAINER_SIZES.lgWide).toMatchObject({
      width: 1024,
      height: 576,
      aspect: '16:9',
    });
  });

  it('defines 9:16 portrait sizes fitted into the same box heights', () => {
    expect(IMG_CONTAINER_SIZES.xsmPortrait).toMatchObject({
      width: Math.round((72 * 9) / 16),
      height: 72,
      aspect: '9:16',
    });
    expect(IMG_CONTAINER_SIZES.smPortrait).toMatchObject({
      width: Math.round((144 * 9) / 16),
      height: 144,
      aspect: '9:16',
    });
    expect(IMG_CONTAINER_SIZES.mdPortrait).toMatchObject({
      width: Math.round((288 * 9) / 16),
      height: 288,
      aspect: '9:16',
    });
    expect(IMG_CONTAINER_SIZES.lgPortrait).toMatchObject({
      width: Math.round((576 * 9) / 16),
      height: 576,
      aspect: '9:16',
    });
  });

  it('lists every size once', () => {
    expect(IMG_CONTAINER_SIZE_LIST.map((size) => size.id)).toEqual([
      'xsm',
      'xsmWide',
      'xsmPortrait',
      'sm',
      'smWide',
      'smPortrait',
      'md',
      'mdWide',
      'mdPortrait',
      'lg',
      'lgWide',
      'lgPortrait',
    ]);
  });
});
