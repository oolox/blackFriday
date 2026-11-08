import { useCallback, useEffect, useRef, useState } from 'react';
import type { SavedAudioKind } from '../../../types/savedAudio';
import { audioFormatLabel, formatAudioDuration } from '../../../utils/audioMime';
import { MediaViewerOverlay } from '../MediaViewerOverlay/MediaViewerOverlay';
import styles from './AudioViewer.module.css';

export interface AudioViewerProps {
  /** Object URL for the audio blob; `null` while it's still loading. */
  src: string | null;
  mimeType?: SavedAudioKind;
  alt?: string;
  durationMs?: number;
  onClose: () => void;
}

function canPlayNormalizedMime(mimeType: SavedAudioKind | undefined): boolean {
  if (!mimeType || typeof document === 'undefined') {
    return true;
  }
  return document.createElement('audio').canPlayType(mimeType) !== '';
}

function secondsToMs(seconds: number): number | undefined {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return undefined;
  }
  return seconds * 1000;
}

/**
 * Fullscreen audio viewer — same overlay chrome as `TextViewer` / `VideoViewer`.
 * Uses a custom control bar (not native `<audio controls>`) so mute hover/click
 * cannot reflow the progress track — Chromium's native volume popout does.
 */
export function AudioViewer({
  src,
  mimeType,
  alt = '',
  durationMs,
  onClose,
}: AudioViewerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [knownDurationMs, setKnownDurationMs] = useState(durationMs);
  const format = mimeType ? audioFormatLabel(mimeType) : null;
  const durationLabel = formatAudioDuration(knownDurationMs ?? durationMs);
  const playable = canPlayNormalizedMime(mimeType);
  const progressMax =
    knownDurationMs != null && Number.isFinite(knownDurationMs) && knownDurationMs > 0
      ? knownDurationMs
      : 0;

  useEffect(() => {
    setKnownDurationMs(durationMs);
    setCurrentMs(0);
    setPlaying(false);
    setMuted(false);
  }, [src, durationMs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || src == null || !playable) {
      return;
    }
    void audio.play().then(
      () => setPlaying(true),
      () => setPlaying(false),
    );
  }, [src, playable]);

  const syncFromElement = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    setCurrentMs(secondsToMs(audio.currentTime) ?? 0);
    const elementMs = secondsToMs(audio.duration);
    if (elementMs != null && elementMs > 0) {
      setKnownDurationMs((prev) => prev ?? elementMs);
    }
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      void audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false),
      );
    } else {
      audio.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    audio.muted = !audio.muted;
    setMuted(audio.muted);
  };

  const seek = (nextMs: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(nextMs)) {
      return;
    }
    audio.currentTime = Math.max(0, nextMs / 1000);
    setCurrentMs(nextMs);
  };

  return (
    <MediaViewerOverlay alt={alt} closeLabel="Close audio" onClose={onClose}>
      <div className={styles.panel} onClick={(event) => event.stopPropagation()}>
        {alt ? <p className={styles.name}>{alt}</p> : null}
        <p className={styles.meta}>
          {format ? `${format} · ${durationLabel}` : durationLabel}
        </p>
        {src == null ? (
          <p className={styles.loading}>Loading audio…</p>
        ) : playable ? (
          <>
            <audio
              ref={audioRef}
              className={styles.audio}
              src={src}
              preload="metadata"
              aria-label={alt || 'Audio'}
              onTimeUpdate={syncFromElement}
              onLoadedMetadata={syncFromElement}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                syncFromElement();
              }}
            />
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.controlButton}
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={togglePlay}
              >
                {playing ? 'Pause' : 'Play'}
              </button>
              <input
                className={styles.progress}
                type="range"
                min={0}
                max={progressMax || 1}
                step={1}
                value={Math.min(currentMs, progressMax || 0)}
                disabled={progressMax <= 0}
                aria-label="Seek"
                onChange={(event) => seek(Number(event.currentTarget.value))}
              />
              <span className={styles.time}>
                {formatAudioDuration(currentMs)} / {durationLabel}
              </span>
              <button
                type="button"
                className={styles.controlButton}
                aria-label={muted ? 'Unmute' : 'Mute'}
                aria-pressed={muted}
                onClick={toggleMute}
              >
                {muted ? 'Unmute' : 'Mute'}
              </button>
            </div>
          </>
        ) : (
          <p className={styles.unsupported}>This format can't be played in this browser</p>
        )}
      </div>
    </MediaViewerOverlay>
  );
}
