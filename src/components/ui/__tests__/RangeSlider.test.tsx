import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { RangeSlider } from '../RangeSlider';
import { theme } from '../../../theme';

function renderRange(
  props: Partial<React.ComponentProps<typeof RangeSlider>> = {},
) {
  const merged: React.ComponentProps<typeof RangeSlider> = {
    value: [40, 160],
    min: 0,
    max: 200,
    step: 10,
    ariaLabelLower: 'Minimum price',
    ariaLabelUpper: 'Maximum price',
    onChange: jest.fn(),
    ...props,
  };
  const utils = render(
    <ThemeProvider theme={theme}>
      <RangeSlider {...merged} />
    </ThemeProvider>,
  );
  return { ...utils, props: merged };
}

describe('RangeSlider', () => {
  it('renders two thumbs (one per range input)', () => {
    renderRange();
    expect(screen.getByLabelText('Minimum price')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximum price')).toBeInTheDocument();
  });

  it('reflects the lower and upper values on the inputs', () => {
    renderRange({ value: [40, 160] });
    expect((screen.getByLabelText('Minimum price') as HTMLInputElement).value).toBe('40');
    expect((screen.getByLabelText('Maximum price') as HTMLInputElement).value).toBe('160');
  });

  it('fires onChange with [next, upper] when the lower thumb moves', () => {
    const onChange = jest.fn();
    renderRange({ value: [40, 160], onChange });
    fireEvent.change(screen.getByLabelText('Minimum price'), { target: { value: '60' } });
    expect(onChange).toHaveBeenCalledWith([60, 160]);
  });

  it('fires onChange with [lower, next] when the upper thumb moves', () => {
    const onChange = jest.fn();
    renderRange({ value: [40, 160], onChange });
    fireEvent.change(screen.getByLabelText('Maximum price'), { target: { value: '180' } });
    expect(onChange).toHaveBeenCalledWith([40, 180]);
  });

  it('clamps the lower thumb at the upper value (cannot cross over)', () => {
    const onChange = jest.fn();
    renderRange({ value: [40, 100], onChange });
    fireEvent.change(screen.getByLabelText('Minimum price'), { target: { value: '180' } });
    expect(onChange).toHaveBeenCalledWith([100, 100]);
  });

  it('clamps the upper thumb at the lower value (cannot cross under)', () => {
    const onChange = jest.fn();
    renderRange({ value: [60, 160], onChange });
    fireEvent.change(screen.getByLabelText('Maximum price'), { target: { value: '20' } });
    expect(onChange).toHaveBeenCalledWith([60, 60]);
  });

  it('does not fire onChange when the value would be unchanged', () => {
    const onChange = jest.fn();
    renderRange({ value: [40, 160], onChange });
    fireEvent.change(screen.getByLabelText('Minimum price'), { target: { value: '40' } });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('honors disabled', () => {
    renderRange({ disabled: true });
    expect(screen.getByLabelText('Minimum price')).toBeDisabled();
    expect(screen.getByLabelText('Maximum price')).toBeDisabled();
  });
});
