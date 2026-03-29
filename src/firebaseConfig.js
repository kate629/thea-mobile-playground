import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// console.log(firebaseConfig);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Sign in anonymously if not already signed in.
 * Returns the stable anonymous uid (persists across page reloads).
 */
export async function ensureAuth() {
  if (auth.currentUser) {
    return auth.currentUser.uid;
  }
  const cred = await signInAnonymously(auth);
  // Force token materialization so Firestore's internal auth listener
  // has the credential before any onSnapshot calls go out.
  await cred.user.getIdToken();
  return cred.user.uid;
}

export default app;
