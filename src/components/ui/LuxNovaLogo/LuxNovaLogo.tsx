import { useEffect, useRef, useState, type AnimationEvent } from 'react';
import styles from './LuxNovaLogo.module.css';

const BASELINE = 32;
const CAP_TOP = 18;
const X_HEIGHT = 20;
const O_RADIUS_Y = 6;
const STROKE_WIDTH = 1.65;
const STROKE_INSET = STROKE_WIDTH / 2;
const CONTENT_LEFT = 46;
const CONTENT_RIGHT = 123;

const VIEWBOX = {
  x: CONTENT_LEFT - STROKE_INSET,
  y: CAP_TOP - STROKE_INSET,
  width: CONTENT_RIGHT - CONTENT_LEFT + STROKE_WIDTH,
  height: BASELINE - CAP_TOP + STROKE_WIDTH,
};

type LogoPhase = 'beforeIntro' | 'intro' | 'idle' | 'hoverOut' | 'hoverIn';

const PHASE_CLASS: Record<LogoPhase, string | undefined> = {
  beforeIntro: undefined,
  intro: styles.intro,
  idle: styles.idle,
  hoverOut: styles.hoverOut,
  hoverIn: styles.hoverIn,
};

export interface LuxNovaLogoProps {
  className?: string;
}

/** LuxNova wordmark — intro draw, then hover undraws and redraws. */
export function LuxNovaLogo({ className }: LuxNovaLogoProps) {
  const logoRef = useRef<SVGSVGElement>(null);
  const phaseRef = useRef<LogoPhase>('beforeIntro');
  const [phase, setPhase] = useState<LogoPhase>('beforeIntro');
  const viewBox = `${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.width} ${VIEWBOX.height}`;

  const setLogoPhase = (next: LogoPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) {
      setLogoPhase('idle');
      return;
    }

    const frame = requestAnimationFrame(() => setLogoPhase('intro'));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleAnimationEnd = (event: AnimationEvent<SVGSVGElement>) => {
    if (!(event.target as Element).classList.contains(styles.letter)) {
      return;
    }

    const firstLetter = logoRef.current?.querySelector(`.${styles.letter}`);
    if (event.target !== firstLetter) {
      return;
    }

    const currentPhase = phaseRef.current;
    if (currentPhase === 'intro') {
      setLogoPhase('idle');
      return;
    }

    if (currentPhase === 'hoverOut') {
      setLogoPhase('hoverIn');
      return;
    }

    if (currentPhase === 'hoverIn') {
      setLogoPhase('idle');
    }
  };

  const handleMouseEnter = () => {
    if (phaseRef.current === 'idle') {
      setLogoPhase('hoverOut');
    }
  };

  const classes = [styles.logo, PHASE_CLASS[phase], className].filter(Boolean).join(' ');

  return (
    <svg
      ref={logoRef}
      className={classes}
      viewBox={viewBox}
      width={VIEWBOX.width}
      height={VIEWBOX.height}
      role="img"
      aria-label="LuxNova"
      onAnimationEnd={handleAnimationEnd}
      onMouseEnter={handleMouseEnter}
    >
      <g className={styles.wordmark}>
        <path
          className={styles.letter}
          pathLength={100}
          d={`M 46 ${CAP_TOP} L 46 ${BASELINE} L 54 ${BASELINE}`}
        />
        <path
          className={styles.letter}
          pathLength={100}
          d={`M 58 ${X_HEIGHT} L 58 ${BASELINE} Q 62 ${BASELINE} 66 ${BASELINE} L 66 ${X_HEIGHT}`}
        />
        <path
          className={styles.letter}
          pathLength={100}
          d={`M 70 ${BASELINE} L 78 ${X_HEIGHT} M 78 ${BASELINE} L 70 ${X_HEIGHT}`}
        />
        <path
          className={styles.letter}
          pathLength={100}
          d={`M 82 ${BASELINE} L 82 ${CAP_TOP} L 92 ${BASELINE} L 92 ${CAP_TOP}`}
        />
        <ellipse
          className={styles.letter}
          pathLength={100}
          cx="99"
          cy={BASELINE - O_RADIUS_Y}
          rx="4.5"
          ry={O_RADIUS_Y}
        />
        <path
          className={styles.letter}
          pathLength={100}
          d={`M 105 ${X_HEIGHT} L 109 ${BASELINE} M 109 ${BASELINE} L 113 ${X_HEIGHT}`}
        />
        <path
          className={styles.letter}
          pathLength={100}
          d={`M 123 ${BASELINE} L 123 22 Q 123 ${X_HEIGHT} 119 ${X_HEIGHT} Q 115 ${X_HEIGHT} 115 26 Q 115 ${BASELINE} 117 ${BASELINE} L 123 ${BASELINE}`}
        />
      </g>
    </svg>
  );
}
