export type SessionState = 'processing' | 'completed';
export type AuthState = 'anon' | 'signedin';

function readParam(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(name);
}

export function getSessionState(): SessionState {
  return readParam('session') === 'processing' ? 'processing' : 'completed';
}

export function getAuthState(): AuthState {
  return readParam('auth') === 'signedin' ? 'signedin' : 'anon';
}

export const MOCK_RECIPIENT_ID = 'mock-recipient-1';
export const MOCK_RECOMMENDATION_ID = 'mock-recommendation-1';
export const MOCK_CAROUSEL_SESSION_ID = `${MOCK_RECIPIENT_ID}_${MOCK_RECOMMENDATION_ID}`;
export const MOCK_UID_ANON = 'playground-anon-uid';
export const MOCK_UID_SIGNED_IN = 'playground-signed-in-uid';
