import { describe, expect, it } from 'vitest';
import {
  dataTransferHasFiles,
  fileMatchesAccept,
  filterFilesByAccept,
} from './useFileDropZone';
import { LUXNOVA_ASSET_MIME } from '../../../utils/luxnovaAssetDrag';

function makeFile(name: string, type: string): File {
  return new File(['x'], name, { type });
}

describe('dataTransferHasFiles', () => {
  it('is true when types include Files', () => {
    expect(
      dataTransferHasFiles({ types: ['Files'] } as unknown as DataTransfer),
    ).toBe(true);
  });

  it('is false for non-file drags', () => {
    expect(
      dataTransferHasFiles({ types: ['text/plain'] } as unknown as DataTransfer),
    ).toBe(false);
    expect(dataTransferHasFiles(null)).toBe(false);
  });

  it('is false for LuxNova asset MIME alone', () => {
    expect(
      dataTransferHasFiles({
        types: [LUXNOVA_ASSET_MIME],
      } as unknown as DataTransfer),
    ).toBe(false);
  });
});

describe('fileMatchesAccept', () => {
  it('allows all when accept is empty', () => {
    expect(fileMatchesAccept(makeFile('a.txt', 'text/plain'))).toBe(true);
  });

  it('matches mime list and image/jpg alias', () => {
    const accept = 'image/png,image/jpeg,image/jpg,image/webp';
    expect(fileMatchesAccept(makeFile('a.png', 'image/png'), accept)).toBe(true);
    expect(fileMatchesAccept(makeFile('a.jpg', 'image/jpeg'), accept)).toBe(true);
    expect(fileMatchesAccept(makeFile('a.txt', 'text/plain'), accept)).toBe(false);
  });

  it('matches extension tokens', () => {
    expect(fileMatchesAccept(makeFile('shot.WEBP', 'image/webp'), '.webp')).toBe(true);
  });
});

describe('filterFilesByAccept', () => {
  it('filters to matching files', () => {
    const files = [
      makeFile('a.png', 'image/png'),
      makeFile('b.txt', 'text/plain'),
    ];
    expect(filterFilesByAccept(files, 'image/png')).toEqual([files[0]]);
  });
});
