import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';
import { db as defaultDb } from '../../../firebaseConfig';
import {
  recipientCollectionPath,
} from '../../../theaWeb/schemas/paths';
import type { Recipient } from '../../../theaWeb/schemas/recipient';
import type { DashboardPerson } from './types';

export interface UseFriendsListResult {
  friends: DashboardPerson[];
  hydrated: boolean;
  error: Error | null;
}

/**
 * Subscribes to `theaWebUser/{uid}/recipient/*` for the signed-in uid and
 * surfaces non-archived recipients in created-at order as `DashboardPerson`s.
 *
 * Skips all subscription work when `uid` is null (anonymous / signed-out)
 * so the homepage's anon path never opens a Firestore listener.
 */
export function useFriendsList(
  uid: string | null,
  firestore: Firestore = defaultDb,
): UseFriendsListResult {
  const [friends, setFriends] = useState<DashboardPerson[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uid) {
      setFriends([]);
      setHydrated(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);

    const ref = collection(firestore, ...recipientCollectionPath(uid));
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (cancelled) return;
        const rows: Array<Recipient & { _docId: string }> = [];
        snap.forEach((d) => {
          const data = d.data() as Recipient;
          if (data.archivedAt) return;
          rows.push({ ...data, _docId: d.id });
        });
        // Stable sort: createdAt ascending. Falls back to doc id for
        // recipients that haven't had a server-side createdAt populated yet.
        rows.sort((a, b) => {
          const at = a.createdAt?.toMillis?.() ?? 0;
          const bt = b.createdAt?.toMillis?.() ?? 0;
          if (at !== bt) return at - bt;
          return a._docId.localeCompare(b._docId);
        });
        const next: DashboardPerson[] = rows.map((r) => ({
          id: r.recipientId ?? r._docId,
          name: r.name,
          emoji: r.emoji ?? '🎁',
          relationship: r.relationship,
        }));
        setFriends(next);
        setHydrated(true);
      },
      (err) => {
        if (cancelled) return;
        setError(err);
        setHydrated(true);
      },
    );

    return () => {
      cancelled = true;
      unsub();
    };
  }, [uid, firestore]);

  return { friends, hydrated, error };
}
