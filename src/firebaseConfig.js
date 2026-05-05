import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  getAuth,
  setPersistence,
  signInAnonymously,
} from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Dev-only: when REACT_APP_USE_EMULATOR=1 the SDK is rewired at first
// instance creation to talk to the local Firebase emulators
// (firestore:8080, auth:9099, functions:5001 — see thea-serverless
// firebase.json). Strict opt-in — never on in production builds. Use
// `REACT_APP_USE_EMULATOR=1 npm start` to enable.
export const USE_EMULATOR = process.env.REACT_APP_USE_EMULATOR === "1";

let _app = null;
let _auth = null;
let _db = null;

export function getAppInstance() {
  if (!_app) _app = initializeApp(firebaseConfig);
  return _app;
}

export function getAuthInstance() {
  if (!_auth) {
    _auth = getAuth(getAppInstance());
    // browserLocalPersistence is the default on web, but making it explicit
    // means Safari Private Browsing (where IndexedDB is read-only and the SDK
    // silently falls back to in-memory) surfaces a setPersistence rejection
    // we can log + telemetry-trap. Without this, the user just looks "signed
    // out on every reload" with no signal — same shape as Bug 2.
    setPersistence(_auth, browserLocalPersistence).catch((err) => {
      console.error("[firebaseConfig] setPersistence(browserLocal) failed:", err);
    });
    if (USE_EMULATOR) {
      // disableWarnings silences the dev-only banner; safe because the flag
      // gate already prevents this branch from running in prod builds.
      connectAuthEmulator(_auth, "http://127.0.0.1:9099", { disableWarnings: true });
    }
  }
  return _auth;
}

export function getDbInstance() {
  if (!_db) {
    _db = getFirestore(getAppInstance());
    if (USE_EMULATOR) {
      connectFirestoreEmulator(_db, "127.0.0.1", 8080);
    }
  }
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
