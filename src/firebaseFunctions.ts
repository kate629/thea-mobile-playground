import { getFunctions, httpsCallable } from 'firebase/functions';
import app from './firebaseConfig';

const functions = getFunctions(app);

export const getCarouselFeed = httpsCallable(functions, 'getCarouselFeed', {
  timeout: 300_000, // 5 min — matches Cloud Function timeout
});
export { functions };
