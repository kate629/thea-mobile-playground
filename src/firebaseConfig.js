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

let _app = null;
let _auth = null;
let _db = null;

export function getAppInstance() {
  if (!_app) _app = initializeApp(firebaseConfig);
  return _app;
}

export function getAuthInstance() {
  if (!_auth) _auth = getAuth(getAppInstance());
  return _auth;
}

export function getDbInstance() {
  if (!_db) _db = getFirestore(getAppInstance());
  return _db;
}

// Lazy proxies preserve the back-compat shape (`import { auth, db } from ...`)
// without firing `getAuth(app)` at module-load time. Member access routes to
// the real instance, with method binding so `this` resolves correctly inside
// Firebase SDK calls. New code should use FirebaseProvider + useAuth()/useDb()
// instead of importing these directly.
function lazyProxy(getInstance) {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const inst = getInstance();
        const value = inst[prop];
        return typeof value === "function" ? value.bind(inst) : value;
      },
      set(_target, prop, value) {
        // Firebase SDK lazily assigns internal state (e.g.
        // `firestore._firestoreClient = new FirestoreClient(...)`) on first
        // use. Without a set trap those writes hit the empty Proxy target
        // and the SDK then reads `undefined` back → crash. Regression
        // covered by `firebaseConfig.test.ts`.
        const inst = getInstance();
        inst[prop] = value;
        return true;
      },
      has(_target, prop) {
        return prop in getInstance();
      },
      deleteProperty(_target, prop) {
        return delete getInstance()[prop];
      },
      ownKeys() {
        return Reflect.ownKeys(getInstance());
      },
      getOwnPropertyDescriptor(_target, prop) {
        const desc = Object.getOwnPropertyDescriptor(getInstance(), prop);
        if (desc) desc.configurable = true;
        return desc;
      },
      getPrototypeOf() {
        return Object.getPrototypeOf(getInstance());
      },
    }
  );
}

/** @type {import('firebase/auth').Auth} */
export const auth = lazyProxy(getAuthInstance);
/** @type {import('firebase/firestore').Firestore} */
export const db = lazyProxy(getDbInstance);

/**
 * Sign in anonymously if not already signed in.
 * Returns the stable uid (persists across page reloads).
 */
export async function ensureAuth() {
  const a = getAuthInstance();
  // Wait for persistence to load before deciding whether to fall back to
  // anon sign-in. Without this, `auth.currentUser` is briefly null on
  // reload while indexedDB rehydrates the persisted user — we'd then
  // race-replace the permanent session with a fresh anon one, and every
  // listener (recommendation doc, giftActivity) would subscribe under the
  // wrong subtree and hang.
  await a.authStateReady();
  if (a.currentUser) {
    return a.currentUser.uid;
  }
  const cred = await signInAnonymously(a);
  // Force token materialization so Firestore's internal auth listener
  // has the credential before any onSnapshot calls go out.
  await cred.user.getIdToken();
  return cred.user.uid;
}

/** @type {import('firebase/app').FirebaseApp} */
const appProxy = lazyProxy(getAppInstance);
export default appProxy;
