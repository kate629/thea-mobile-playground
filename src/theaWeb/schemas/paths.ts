// Typed path-builders. Each returns a readonly tuple suitable for spreading into
// Firebase v9+ modular APIs: `doc(db, ...recipientDocPath(uid, id))`.
//
// Using `as const` tuples keeps the segment count and types known at the call site.

export const COLLECTION_THEA_WEB_USER = 'theaWebUser';
export const COLLECTION_RECIPIENT = 'recipient';
export const COLLECTION_RECOMMENDATION = 'recommendation';
export const COLLECTION_GIFT_ACTIVITY = 'giftActivity';
export const COLLECTION_THEA_WEB_MERGE_AUDIT = 'theaWebMergeAudit';

// User
export const theaWebUserDocPath = (uid: string) =>
  [COLLECTION_THEA_WEB_USER, uid] as const;

// Recipient
export const recipientCollectionPath = (uid: string) =>
  [COLLECTION_THEA_WEB_USER, uid, COLLECTION_RECIPIENT] as const;

export const recipientDocPath = (uid: string, recipientId: string) =>
  [COLLECTION_THEA_WEB_USER, uid, COLLECTION_RECIPIENT, recipientId] as const;

// Recommendation
export const recommendationCollectionPath = (uid: string, recipientId: string) =>
  [
    COLLECTION_THEA_WEB_USER,
    uid,
    COLLECTION_RECIPIENT,
    recipientId,
    COLLECTION_RECOMMENDATION,
  ] as const;

export const recommendationDocPath = (
  uid: string,
  recipientId: string,
  recommendationId: string,
) =>
  [
    COLLECTION_THEA_WEB_USER,
    uid,
    COLLECTION_RECIPIENT,
    recipientId,
    COLLECTION_RECOMMENDATION,
    recommendationId,
  ] as const;

// GiftActivity
export const giftActivityCollectionPath = (uid: string, recipientId: string) =>
  [
    COLLECTION_THEA_WEB_USER,
    uid,
    COLLECTION_RECIPIENT,
    recipientId,
    COLLECTION_GIFT_ACTIVITY,
  ] as const;

export const giftActivityDocPath = (
  uid: string,
  recipientId: string,
  productId: string,
) =>
  [
    COLLECTION_THEA_WEB_USER,
    uid,
    COLLECTION_RECIPIENT,
    recipientId,
    COLLECTION_GIFT_ACTIVITY,
    productId,
  ] as const;

// MergeAudit (top-level)
export const theaWebMergeAuditCollectionPath = () =>
  [COLLECTION_THEA_WEB_MERGE_AUDIT] as const;

export const theaWebMergeAuditDocPath = (auditId: string) =>
  [COLLECTION_THEA_WEB_MERGE_AUDIT, auditId] as const;
