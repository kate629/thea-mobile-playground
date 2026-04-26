import { AuthAdapter, AuthState } from './types';

/**
 * Mutable mock adapter. Stories drive lifecycle transitions by calling
 * `setState(next)` — every subscribed listener fires immediately. The
 * adapter calls each new subscriber once with the current state so the
 * View can render synchronously on mount.
 */
export class MockAuthAdapter implements AuthAdapter {
  private current: AuthState;
  private listeners = new Set<(s: AuthState) => void>();

  constructor(initial: AuthState = { status: 'loading' }) {
    this.current = initial;
  }

  subscribe = (cb: (state: AuthState) => void): (() => void) => {
    this.listeners.add(cb);
    cb(this.current);
    return () => {
      this.listeners.delete(cb);
    };
  };

  requestSignIn = (): void => {
    this.setState({
      status: 'signed-in',
      user: { uid: 'mock-uid', displayName: 'Mock User', initial: 'M' },
    });
  };

  /** Test/story-only escape hatch. Drives the lifecycle externally. */
  setState = (next: AuthState): void => {
    this.current = next;
    this.listeners.forEach((cb) => cb(next));
  };

  getState = (): AuthState => this.current;
}
