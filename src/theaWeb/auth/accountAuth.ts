/**
 * Account auth: sign-up / sign-in / merge primitives.
 *
 * Mirrors `3-12-sovrn-launch-version/src/lib/accountAuth.ts`. The structural
 * difference: sovrn's `auth/credential-already-in-use` fallback relies on
 * sessionStorage to migrate likes (their anon writes are local-only). Ours
 * write through to Firestore, so the fallback path mints a merge token
 * (while still anon), signs in as the existing real user, then calls
 * `mergeGiftFlow({fromUid, token})` to copy recipient/recommendation/
 * giftActivity subtrees into the surviving uid and cascade-delete the source.
 *
 * The merge call is best-effort — failures are logged but do NOT block sign-in.
 * The user lands signed-in either way; in the worst case their anon-era saves
 * are orphaned (recoverable via re-save).
 *
 * Supported SSO providers: Google and Apple. Both share the same
 * link-or-merge shape; provider-specific differences live only in which
 * `firebase/auth` provider class instantiates the OAuth flow.
 */

import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  type Auth,
  type AuthCredential,
  type User,
  type UserCredential,
  createUserWithEmailAndPassword,
  getRedirectResult,
  linkWithCredential,
  linkWithPopup,
  linkWithRedirect,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';

import { auth as defaultAuth } from '../../firebaseConfig';
import { mergeGiftFlow, mintMergeToken } from '../callables';
import type { MergeStatus } from './MergeStateContext';

/**
 * Optional callback the sign-in flow uses to drive `MergeStateContext` so
 * downstream listeners can pause re-subscribing while the anon → permanent
 * fan-out is in flight (sheet bug #58). Called with 'merging' before auth
 * flips, then 'merged' on success or 'failed' on merge error. When the
 * sign-in itself fails before any merge attempt, fires 'idle' so the
 * status doesn't stay stuck.
 */
export type OnMergeStatus = (status: MergeStatus) => void;

export function isMobileUserAgent(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Mint a merge token while we're still authenticated as the anon uid, then
 * return both. Callers capture this BEFORE switching auth.
 */
async function captureMergeIntent(authInstance: Auth): Promise<{
  fromUid: string;
  token: string;
} | null> {
  const fromUid = authInstance.currentUser?.uid;
  if (!fromUid) return null;
  try {
    const result = await mintMergeToken({});
    return { fromUid, token: result.data.token };
  } catch (err) {
    console.error('[accountAuth] mintMergeToken failed:', err);
    return null;
  }
}

/**
 * Best-effort merge from anon uid into the now-signed-in permanent uid.
 * Idempotent server-side via `_mergedFrom` markers — safe to retry.
 *
 * The caller is expected to have flipped MergeStatus to 'merging' BEFORE
 * the auth-state change (so listeners pause from the moment the uid
 * swaps). This wrapper transitions to 'merged' on success or 'failed' on
 * mergeGiftFlow error.
 */
async function tryMerge(
  intent: { fromUid: string; token: string } | null,
  onMergeStatus?: OnMergeStatus,
): Promise<void> {
  if (!intent) return;
  try {
    await mergeGiftFlow(intent);
    onMergeStatus?.('merged');
  } catch (err) {
    console.error('[accountAuth] mergeGiftFlow failed:', err);
    onMergeStatus?.('failed');
  }
}

/**
 * Create an account with email + password. If the current user is anon
 * (App-Check anon-auth), we upgrade in-place via `linkWithCredential` so the
 * uid survives the sign-up boundary. If the email is already attached to a
 * different real account, we mint a merge token (as anon), create/sign-in
 * the real account, then call `mergeGiftFlow` to copy the anon subtree over.
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  authInstance: Auth = defaultAuth,
  onMergeStatus?: OnMergeStatus,
): Promise<UserCredential> {
  if (authInstance.currentUser?.isAnonymous) {
    const credential = EmailAuthProvider.credential(email, password);
    try {
      return await linkWithCredential(authInstance.currentUser, credential);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (
        code === 'auth/email-already-in-use' ||
        code === 'auth/credential-already-in-use'
      ) {
        // Capture merge intent while still anon, then sign in as the existing
        // real user — `mergeGiftFlow` migrates the anon subtree afterwards.
        const intent = await captureMergeIntent(authInstance);
        // Flip merging BEFORE the auth-state change so listeners pause from
        // the moment the uid swaps (sheet bug #58).
        if (intent) onMergeStatus?.('merging');
        try {
          const cred = await signInWithEmailAndPassword(authInstance, email, password).catch(
            () => createUserWithEmailAndPassword(authInstance, email, password),
          );
          await tryMerge(intent, onMergeStatus);
          return cred;
        } catch (signInErr) {
          if (intent) onMergeStatus?.('idle');
          throw signInErr;
        }
      }
      throw err;
    }
  }
  return createUserWithEmailAndPassword(authInstance, email, password);
}

export async function signInWithEmail(
  email: string,
  password: string,
  authInstance: Auth = defaultAuth,
  onMergeStatus?: OnMergeStatus,
): Promise<UserCredential> {
  // If the current user is anon, capture merge intent first so we can migrate
  // their saves into the signed-in account afterwards.
  const intent = authInstance.currentUser?.isAnonymous
    ? await captureMergeIntent(authInstance)
    : null;
  // Flip merging BEFORE the auth-state change so listeners pause from the
  // moment the uid swaps (sheet bug #58).
  if (intent) onMergeStatus?.('merging');
  try {
    const cred = await signInWithEmailAndPassword(authInstance, email, password);
    await tryMerge(intent, onMergeStatus);
    return cred;
  } catch (err) {
    if (intent) onMergeStatus?.('idle');
    throw err;
  }
}

/**
 * Recover an OAuthCredential from a `credential-already-in-use` error. Tries
 * `OAuthProvider.credentialFromError` (works for Apple and any OAuth provider)
 * first, then `GoogleAuthProvider.credentialFromError` as a typed fallback.
 * Either yields a credential we can hand to `signInWithCredential`.
 */
function credentialFromError(err: unknown): AuthCredential | null {
  type CredFromErrInput =
    Parameters<typeof OAuthProvider.credentialFromError>[0];
  return (
    OAuthProvider.credentialFromError(err as CredFromErrInput) ??
    GoogleAuthProvider.credentialFromError(err as CredFromErrInput)
  );
}

/**
 * Recover from `auth/credential-already-in-use` by minting a merge token while
 * we're still anon, signing in via the recovered credential, then firing the
 * best-effort merge. Centralised because both popup and redirect paths use the
 * same recovery shape.
 *
 * The caller has already detected the in-use error and extracted the
 * credential — we run the post-extract part of the dance.
 */
async function recoverFromCredentialInUse(
  credential: AuthCredential,
  authInstance: Auth,
  onMergeStatus?: OnMergeStatus,
): Promise<UserCredential> {
  // Capture intent while still anon (the failed link kept the anon uid as
  // currentUser), then signInWithCredential switches us.
  const intent = await captureMergeIntent(authInstance);
  // Flip merging BEFORE the auth-state change (sheet bug #58).
  if (intent) onMergeStatus?.('merging');
  try {
    const result = await signInWithCredential(authInstance, credential);
    await tryMerge(intent, onMergeStatus);
    return result;
  } catch (signInErr) {
    if (intent) onMergeStatus?.('idle');
    throw signInErr;
  }
}

/**
 * Generic OAuth-provider sign-in. Popup on desktop, redirect on mobile. Anon
 * users upgrade via `linkWithPopup`/`linkWithRedirect` so the uid is preserved.
 * When the OAuth account already belongs to a different real user, we recover
 * the credential from the error, mint a merge token, sign in as the existing
 * user via `signInWithCredential`, then merge.
 *
 * Returns null when a redirect is initiated (mobile) — the caller's flow
 * resumes via `consumeAuthRedirectResult` (called at the AuthGate root
 * useEffect on every page load, so the credential lands wherever the user
 * returns to).
 *
 * IMPORTANT: redirect requires `authDomain` to be on the same origin as the
 * app, otherwise modern browsers (Chrome M115+, Firefox 109+, Safari 16.1+)
 * partition storage between the auth handler and the app and the credential
 * never propagates. Configure `REACT_APP_FIREBASE_AUTH_DOMAIN` to your
 * hosting domain (Firebase Hosting auto-serves `/__/auth/handler` on every
 * hosting site).
 */
async function signInWithOAuthProvider(
  provider: GoogleAuthProvider | OAuthProvider,
  authInstance: Auth,
  onMergeStatus?: OnMergeStatus,
): Promise<UserCredential | null> {
  const mobile = isMobileUserAgent();
  const anonUser = authInstance.currentUser?.isAnonymous
    ? authInstance.currentUser
    : null;

  if (anonUser) {
    try {
      if (mobile) {
        await linkWithRedirect(anonUser, provider);
        return null;
      }
      return await linkWithPopup(anonUser, provider);
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === 'auth/credential-already-in-use') {
        const credential = credentialFromError(err);
        if (credential) {
          return recoverFromCredentialInUse(credential, authInstance, onMergeStatus);
        }
        // No recoverable credential — fall through to a fresh sign-in below
        // so the user at least gets an authenticated session.
      } else {
        throw err;
      }
    }
  }

  if (mobile) {
    await signInWithRedirect(authInstance, provider);
    return null;
  }
  return signInWithPopup(authInstance, provider);
}

/** Google sign-in. Thin wrapper over `signInWithOAuthProvider`. */
export async function signInWithGoogle(
  authInstance: Auth = defaultAuth,
  onMergeStatus?: OnMergeStatus,
): Promise<UserCredential | null> {
  return signInWithOAuthProvider(new GoogleAuthProvider(), authInstance, onMergeStatus);
}

/**
 * Apple sign-in. Thin wrapper over `signInWithOAuthProvider`. Requests `email`
 * and `name` scopes — note that Apple only returns `name` on the user's first
 * authorization (revoke + re-authorize from the Apple ID settings to test).
 * Apple never returns a photo URL, and the email may be a `@privaterelay.
 * appleid.com` proxy when the user opts to hide their address.
 */
export async function signInWithApple(
  authInstance: Auth = defaultAuth,
  onMergeStatus?: OnMergeStatus,
): Promise<UserCredential | null> {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  return signInWithOAuthProvider(provider, authInstance, onMergeStatus);
}

/**
 * Mobile-redirect counterpart: when an OAuth provider returns from
 * `linkWithRedirect` with `auth/credential-already-in-use`, recover the
 * credential and sign in as the existing user instead of stranding the user
 * unsigned. Provider-agnostic — handles both Google and Apple via
 * `credentialFromError` (which tries both extractors).
 */
export async function consumeAuthRedirectResult(
  authInstance: Auth = defaultAuth,
  onMergeStatus?: OnMergeStatus,
): Promise<User | null> {
  try {
    const result = await getRedirectResult(authInstance);
    return result?.user ?? null;
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/credential-already-in-use') {
      const credential = credentialFromError(err);
      if (credential) {
        const result = await recoverFromCredentialInUse(
          credential,
          authInstance,
          onMergeStatus,
        );
        return result.user;
      }
    }
    throw err;
  }
}

export async function sendPasswordReset(
  email: string,
  authInstance: Auth = defaultAuth,
): Promise<void> {
  await sendPasswordResetEmail(authInstance, email);
}

export async function signOutUser(
  authInstance: Auth = defaultAuth,
): Promise<void> {
  await signOut(authInstance);
}
