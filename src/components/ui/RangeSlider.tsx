import React, { useCallback } from 'react';
import styled from 'styled-components';

export interface RangeSliderProps {
  /** Tuple of `[lower, upper]` values. */
  value: [number, number];
  min?: number;
  max?: number;
  step?: number;
  /** Fires with the new tuple after either thumb moves. */
  onChange?: (value: [number, number]) => void;
  disabled?: boolean;
  ariaLabelLower?: string;
  ariaLabelUpper?: string;
}

/**
 * Dual-thumb range slider, no external deps. Two stacked native
 * `<input type="range">` elements share a track; clamping logic in the
 * change handlers keeps the lower thumb at-or-below the upper. The track
 * fill between the thumbs is a CSS gradient driven by the current values.
 *
 * Used on the profile drawer's price filter (bug #51) — mirrors the OLD
 * `givethea.com` UX (left $0 / right $200+, both labels track their thumb).
 */

const TRACK_HEIGHT = 8;
const THUMB_SIZE = 20;

const Wrap = styled.div<{ $disabled: boolean }>`
  width: 100%;
  position: relative;
  height: ${THUMB_SIZE}px;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
`;

const Track = styled.div`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: ${TRACK_HEIGHT}px;
  margin-top: -${TRACK_HEIGHT / 2}px;
  background: hsl(var(--muted));
  border-radius: 9999px;
  pointer-events: none;
`;

const FilledRange = styled.div<{ $left: number; $right: number }>`
  position: absolute;
  top: 0;
  bottom: 0;
  left: ${({ $left }) => $left}%;
  right: ${({ $right }) => 100 - $right}%;
  background: hsl(var(--primary));
  border-radius: 9999px;
`;

/* Both range inputs sit on top of each other. Pointer-events confined to the
 * thumbs so each one can be grabbed independently. */
const Range = styled.input.attrs({ type: 'range' })`
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  width: 100%;
  height: ${THUMB_SIZE}px;
  margin-top: -${THUMB_SIZE / 2}px;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;

  &::-webkit-slider-runnable-track {
    background: transparent;
    height: ${TRACK_HEIGHT}px;
  }
  &::-moz-range-track {
    background: transparent;
    height: ${TRACK_HEIGHT}px;
  }

  &::-webkit-slider-thumb {
    pointer-events: auto;
    -webkit-appearance: none;
    appearance: none;
    width: ${THUMB_SIZE}px;
    height: ${THUMB_SIZE}px;
    margin-top: -6px;
    border-radius: 50%;
    background: hsl(var(--background));
    border: 2px solid hsl(var(--primary));
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: transform 120ms ease;
  }
  &::-moz-range-thumb {
    pointer-events: auto;
    width: ${THUMB_SIZE}px;
    height: ${THUMB_SIZE}px;
    border-radius: 50%;
    background: hsl(var(--background));
    border: 2px solid hsl(var(--primary));
    box-shadow: var(--shadow-card);
    cursor: pointer;
  }

  &:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 4px hsl(var(--ring) / 0.3);
  }
`;

function pct(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  ariaLabelLower,
  ariaLabelUpper,
}) => {
  const [lower, upper] = value;

  // Clamp lower so it can never exceed upper. Without this the user can drag
  // the left thumb past the right one and the labels swap, which reads as a
  // janky bug.
  const handleLowerChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Math.min(Number(e.currentTarget.value), upper);
      if (next !== lower) onChange?.([next, upper]);
    },
    [lower, upper, onChange],
  );

  const handleUpperChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = Math.max(Number(e.currentTarget.value), lower);
      if (next !== upper) onChange?.([lower, next]);
    },
    [lower, upper, onChange],
  );

  const leftPct = pct(lower, min, max);
  const rightPct = pct(upper, min, max);

  return (
    <Wrap $disabled={disabled}>
      <Track>
        <FilledRange $left={leftPct} $right={rightPct} />
      </Track>
      <Range
        value={lower}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={handleLowerChange}
        aria-label={ariaLabelLower}
      />
      <Range
        value={upper}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onChange={handleUpperChange}
        aria-label={ariaLabelUpper}
      />
    </Wrap>
  );
};
