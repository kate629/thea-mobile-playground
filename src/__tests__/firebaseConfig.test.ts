// Mock the firebase SDK *before* importing firebaseConfig so the module's
// `initializeApp` / `getAuth` / `getFirestore` calls (the lazy accessors)
// resolve to fakes we can introspect. We mimic the lazy-init pattern of the
// real Firestore SDK: `firestore._firestoreClient = new FirestoreClient(...)`
// is assigned the first time you call a Firestore function, then subsequent
// calls read it back. This is exactly what surfaced the prod regression where
// the Proxy had no `set` trap and Firebase silently lost its internal client.

const initCounts = { app: 0, auth: 0, firestore: 0 };

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn((config: unknown) => {
    initCounts.app += 1;
    return { __isApp: true, options: config };
  }),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn((app: unknown) => {
    initCounts.auth += 1;
    // Plain object (no class) so reading prototype is benign; method binding
    // is still verifiable because `recordThis` captures `this` at call time.
    const auth = {
      _app: app,
      currentUser: null as null | { uid: string },
      _capturedThis: null as unknown,
    };
    Object.assign(auth, {
      authStateReady: function authStateReady(this: unknown) {
        (auth as { _capturedThis: unknown })._capturedThis = this;
        return Promise.resolve();
      },
    });
    return auth;
  }),
  signInAnonymously: jest.fn((auth: { currentUser: { uid: string } | null }) => {
    auth.currentUser = { uid: 'anon-uid' };
    return Promise.resolve({ user: { ...auth.currentUser, getIdToken: () => Promise.resolve('tok') } });
  }),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn((app: unknown) => {
    initCounts.firestore += 1;
    // The lazy-init field that Firebase Firestore actually uses internally —
    // this is the property whose Proxy-set went into the void in production.
    const firestore: { _app: unknown; _firestoreClient: unknown } = {
      _app: app,
      _firestoreClient: undefined,
    };
    return firestore;
  }),
}));

beforeEach(() => {
  initCounts.app = 0;
  initCounts.auth = 0;
  initCounts.firestore = 0;
  // Force a fresh module so the memoized `_app/_auth/_db` singletons inside
  // firebaseConfig start clean each test.
  jest.resetModules();
});

describe('firebaseConfig — lazy initialization', () => {
  test('importing the module does NOT call initializeApp / getAuth / getFirestore', () => {
    // The whole point of the lazy refactor: a story or test that imports
    // firebaseConfig (directly or transitively) must not trigger SDK init.
    require('../firebaseConfig');
    expect(initCounts.app).toBe(0);
    expect(initCounts.auth).toBe(0);
    expect(initCounts.firestore).toBe(0);
  });

  test('first auth member access initializes the SDK exactly once', () => {
    const { auth } = require('../firebaseConfig');
    // Touch a property — should trigger getAuth (and underlying initializeApp).
    void auth.currentUser;
    expect(initCounts.app).toBe(1);
    expect(initCounts.auth).toBe(1);
    // Subsequent access reuses the memoized instance.
    void auth.currentUser;
    expect(initCounts.auth).toBe(1);
  });

  test('explicit accessors return real (non-Proxy) instances', () => {
    const { getAppInstance, getAuthInstance, getDbInstance } = require('../firebaseConfig');
    const app = getAppInstance();
    const auth = getAuthInstance();
    const db = getDbInstance();
    expect(app.__isApp).toBe(true);
    expect(auth._app).toBe(app);
    expect(db._app).toBe(app);
  });
});

describe('firebaseConfig — Proxy back-compat exports', () => {
  test('proxy reads pass through to the real instance', () => {
    const { db, getDbInstance } = require('../firebaseConfig');
    const real = getDbInstance();
    real._firestoreClient = { mark: 'set-from-test' };
    expect((db as { _firestoreClient: { mark: string } })._firestoreClient.mark).toBe('set-from-test');
  });

  test('proxy writes land on the real instance (regression: missing set trap)', () => {
    // This is the bug that took down prod. Without a `set` trap, Firebase's
    // internal `firestore._firestoreClient = new FirestoreClient(...)` lands
    // on the empty Proxy target {} and the next read returns undefined →
    // `Cannot read properties of undefined (reading 'verifyNotTerminated')`.
    const { db, getDbInstance } = require('../firebaseConfig');
    const real = getDbInstance();
    expect(real._firestoreClient).toBeUndefined();

    // Simulate Firebase's lazy-init pattern via the Proxy.
    (db as { _firestoreClient: unknown })._firestoreClient = { __client: true };

    // Both the Proxy and the underlying real instance must observe the write.
    expect(real._firestoreClient).toEqual({ __client: true });
    expect((db as { _firestoreClient: unknown })._firestoreClient).toEqual({ __client: true });
  });

  test('proxy method calls bind `this` to the real instance', () => {
    const { auth, getAuthInstance } = require('../firebaseConfig');
    const real = getAuthInstance();
    // Trigger via the proxy.
    void (auth as { authStateReady: () => Promise<void> }).authStateReady();
    // The fake auth captures `this` at call time — must be the real instance,
    // not the Proxy target. If method binding is wrong, downstream Firebase
    // code that does `this._app` would silently see the wrong object.
    expect((real as { _capturedThis: unknown })._capturedThis).toBe(real);
  });

  test('`prop in proxy` matches the real instance', () => {
    const { db, getDbInstance } = require('../firebaseConfig');
    const real = getDbInstance();
    real._firestoreClient = { __client: true };
    expect('_firestoreClient' in db).toBe(true);
    expect('_nonexistent' in db).toBe(false);
  });

  test('deleting via the proxy removes from the real instance', () => {
    const { db, getDbInstance } = require('../firebaseConfig');
    const real = getDbInstance();
    real._firestoreClient = { __client: true };
    delete (db as { _firestoreClient?: unknown })._firestoreClient;
    expect(real._firestoreClient).toBeUndefined();
  });

  test('ensureAuth uses the real auth (not the Proxy) for SDK calls', async () => {
    const { ensureAuth, getAuthInstance } = require('../firebaseConfig');
    const real = getAuthInstance();
    const uid = await ensureAuth();
    expect(uid).toBe('anon-uid');
    expect(real.currentUser?.uid).toBe('anon-uid');
  });
});
