import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { getAppInstance, USE_EMULATOR } from './firebaseConfig';

// Use the explicit accessor (returns the real FirebaseApp, not a Proxy) so
// the Functions SDK can stash internal client state on the app instance
// without going through Proxy traps.
const functions = getFunctions(getAppInstance());

// Dev-only: route callable invocations to the local emulator when
// REACT_APP_USE_EMULATOR=1. Strict opt-in — see firebaseConfig.js.
if (USE_EMULATOR) {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

export const getCarouselFeed = httpsCallable(functions, 'getCarouselFeed', {
  timeout: 300_000, // 5 min — matches Cloud Function timeout
});
export const getFastCarouselFeed = httpsCallable(functions, 'getFastCarouselFeed', {
  timeout: 60_000, // 1 min — matches Cloud Function timeout
});
export { functions };
