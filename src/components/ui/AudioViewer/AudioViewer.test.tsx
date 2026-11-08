import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AudioViewer } from './AudioViewer';

describe('AudioViewer', () => {
  beforeEach(() => {
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
    vi.spyOn(window.HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('probably');
    Object.defineProperty(window.HTMLMediaElement.prototype, 'duration', {
      configurable: true,
      get: () => 12.4,
    });
    Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
      configurable: true,
      writable: true,
      value: 0,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps progress range layout independent of mute hover and click', async () => {
    const user = userEvent.setup();
    render(
      <AudioViewer
        src="blob:audio-test"
        mimeType="audio/wav"
        alt="rain.wav"
        durationMs={12_400}
        onClose={vi.fn()}
      />,
    );

    const progress = screen.getByRole('slider', { name: 'Seek' });
    const mute = screen.getByRole('button', { name: 'Mute' });
    const progressRectBefore = progress.getBoundingClientRect();

    await user.hover(mute);
    expect(progress.getBoundingClientRect().width).toBe(progressRectBefore.width);
    expect(progress.getBoundingClientRect().left).toBe(progressRectBefore.left);

    await user.click(mute);
    expect(screen.getByRole('button', { name: 'Unmute' })).toBeInTheDocument();
    expect(progress.getBoundingClientRect().width).toBe(progressRectBefore.width);
    expect(screen.getByRole('slider', { name: 'Seek' })).toBe(progress);
    expect(progress).toHaveAttribute('max', '12400');
  });
});
