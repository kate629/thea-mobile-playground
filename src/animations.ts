import { keyframes } from 'styled-components';

/* Cursor blink for the typewriter hero. Square wave (0/50% on, 50.01/100% off)
   matches the visual feel of the source's animate-pulse cursor. */
export const cursorBlink = keyframes`
  0%, 50% { opacity: 1; }
  50.01%, 100% { opacity: 0; }
`;

export const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const scaleIn = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

/* Tab badge pop. Source references `.badge-pop` (ResultsPageAuth.tsx:1474, 1491)
   without a CSS definition; we define a small bump-and-settle so the badges
   pulse when their counter increments. The View remounts the badge via a
   pulseKey so this fires on every count increase. */
export const badgePop = keyframes`
  0% { transform: scale(1); }
  40% { transform: scale(1.18); }
  100% { transform: scale(1); }
`;

export const slideInFromRight = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

export const slideInFromBottom = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;
