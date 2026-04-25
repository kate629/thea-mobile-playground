import React from 'react';
import styled from 'styled-components';

export interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
  disabled?: boolean;
  ariaLabel?: string;
  /** Optional formatter for the visually-displayed current value. Defaults to the raw number. */
  formatValue?: (v: number) => string;
  /** Show the current value above the thumb. */
  showValue?: boolean;
}

const Wrap = styled.div<{ $disabled: boolean }>`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
  pointer-events: ${({ $disabled }) => ($disabled ? 'none' : 'auto')};
`;

const ValueRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
`;

const ValueText = styled.span`
  font-weight: 600;
  color: hsl(var(--foreground));
`;

/* Range input — track + thumb styled across browsers. */
const Range = styled.input.attrs({ type: 'range' })<{ $progress: number }>`
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 24px;
  background: transparent;
  cursor: pointer;

  &::-webkit-slider-runnable-track {
    height: 8px;
    border-radius: 9999px;
    background: linear-gradient(
      to right,
      hsl(var(--primary)) 0%,
      hsl(var(--primary)) ${({ $progress }) => $progress}%,
      hsl(var(--muted)) ${({ $progress }) => $progress}%,
      hsl(var(--muted)) 100%
    );
  }
  &::-moz-range-track {
    height: 8px;
    border-radius: 9999px;
    background: hsl(var(--muted));
  }
  &::-moz-range-progress {
    height: 8px;
    border-radius: 9999px;
    background: hsl(var(--primary));
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    margin-top: -6px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: hsl(var(--background));
    border: 2px solid hsl(var(--primary));
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: transform 120ms ease;
  }
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
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

export const Slider: React.FC<SliderProps> = ({
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  disabled = false,
  ariaLabel,
  formatValue,
  showValue = false,
}) => {
  const progress = max === min ? 0 : Math.round(((value - min) / (max - min)) * 100);
  return (
    <Wrap $disabled={disabled}>
      {showValue && (
        <ValueRow>
          <span>{formatValue ? formatValue(min) : min}</span>
          <ValueText>{formatValue ? formatValue(value) : value}</ValueText>
          <span>{formatValue ? formatValue(max) : max}</span>
        </ValueRow>
      )}
      <Range
        value={value}
        min={min}
        max={max}
        step={step}
        $progress={progress}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange?.(Number(e.currentTarget.value))}
      />
    </Wrap>
  );
};
