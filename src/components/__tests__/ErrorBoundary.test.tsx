import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '../ErrorBoundary';

const Boom: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) throw new Error('kaboom');
  return <div>healthy</div>;
};

describe('ErrorBoundary', () => {
  // React logs uncaught render errors to console.error in dev. Suppress here.
  let errorSpy: jest.SpyInstance;
  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    errorSpy.mockRestore();
  });

  test('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  test('renders default fallback UI when child throws', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('We hit a snag.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument();
  });

  test('renders custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={(err) => <div data-testid="custom-fallback">{err.message}</div>}>
        <Boom shouldThrow />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId('custom-fallback')).toHaveTextContent('kaboom');
  });

  test('reset() clears the error state', () => {
    const Capture: React.FC = () => {
      const [show, setShow] = React.useState(true);
      return (
        <ErrorBoundary
          fallback={(_err, reset) => (
            <button
              data-testid="reset"
              onClick={() => {
                setShow(false);
                reset();
              }}
            >
              try again
            </button>
          )}
        >
          <Boom shouldThrow={show} />
        </ErrorBoundary>
      );
    };
    render(<Capture />);
    fireEvent.click(screen.getByTestId('reset'));
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });
});
