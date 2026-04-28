import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAppInstance } from './firebaseConfig';

// Use the explicit accessor (returns the real FirebaseApp, not a Proxy) so
// the Functions SDK can stash internal client state on the app instance
// without going through Proxy traps.
const functions = getFunctions(getAppInstance());

export const getCarouselFeed = httpsCallable(functions, 'getCarouselFeed', {
  timeout: 300_000, // 5 min — matches Cloud Function timeout
});
export const getFastCarouselFeed = httpsCallable(functions, 'getFastCarouselFeed', {
  timeout: 60_000, // 1 min — matches Cloud Function timeout
});
export { functions };
