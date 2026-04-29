import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';

import { useDb, useEnsureAuth } from '../firebase/FirebaseContext';
import { recommendationCollectionPath } from '../schemas/paths';

type Resolution =
  | { kind: 'loading' }
  | { kind: 'redirect'; to: string }
  | { kind: 'no-recommendations' }
  | { kind: 'error'; error: Error };

/**
 * Thin redirect for `/board/:recipientId`. Looks up the most recent
 * recommendation under the signed-in user's recipient subtree and redirects
 * to `/quiz/results/:recipientId/:recommendationId`. Falls back to `/quiz`
 * when the recipient has no recommendations yet.
 *
 * Lives here as a stopgap until the in-flight "board" PR (which owns the
 * full multi-recommendation list view) lands. The friend-tile click target
 * was wired up before that destination shipped, leaving a blank-page bug.
 */
const BoardRoute: React.FC = () => {
  const { recipientId } = useParams<{ recipientId: string }>();
  const db = useDb();
  const ensureAuth = useEnsureAuth();
  const [state, setState] = useState<Resolution>({ kind: 'loading' });

  useEffect(() => {
    if (!recipientId) {
      setState({ kind: 'error', error: new Error('Missing recipientId') });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const uid = await ensureAuth();
        const ref = collection(db, ...recommendationCollectionPath(uid, recipientId));
        // createdAt is the canonical ordering field on recommendation docs;
        // limit(1) keeps this one-doc fetch cheap.
        const snap = await getDocs(query(ref, orderBy('createdAt', 'desc'), limit(1)));
        if (cancelled) return;
        const first = snap.docs[0];
        if (!first) {
          setState({ kind: 'no-recommendations' });
          return;
        }
        setState({
          kind: 'redirect',
          to: `/quiz/results/${recipientId}/${first.id}`,
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: 'error',
          error: err instanceof Error ? err : new Error(String(err)),
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipientId, db, ensureAuth]);

  if (state.kind === 'redirect') return <Navigate to={state.to} replace />;
  if (state.kind === 'no-recommendations')
    return <Navigate to="/quiz" replace state={{ entry_point: 'board_redirect' }} />;
  if (state.kind === 'error') {
    // Surface enough that "blank page" never happens again — fall back home
    // with the error in console for debugging.
    console.error('[BoardRoute]', state.error);
    return <Navigate to="/" replace />;
  }
  return null;
};

export default BoardRoute;
