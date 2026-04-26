import {
  COLLECTION_GIFT_ACTIVITY,
  COLLECTION_RECIPIENT,
  COLLECTION_RECOMMENDATION,
  COLLECTION_THEA_WEB_MERGE_AUDIT,
  COLLECTION_THEA_WEB_USER,
  giftActivityCollectionPath,
  giftActivityDocPath,
  recipientCollectionPath,
  recipientDocPath,
  recommendationCollectionPath,
  recommendationDocPath,
  theaWebMergeAuditCollectionPath,
  theaWebMergeAuditDocPath,
  theaWebUserDocPath,
} from '../paths';

describe('Collection name constants', () => {
  test('user root is theaWebUser (camelCase, prefixed)', () => {
    expect(COLLECTION_THEA_WEB_USER).toBe('theaWebUser');
  });

  test('subcollection names are unprefixed (scoped under user already)', () => {
    expect(COLLECTION_RECIPIENT).toBe('recipient');
    expect(COLLECTION_RECOMMENDATION).toBe('recommendation');
    expect(COLLECTION_GIFT_ACTIVITY).toBe('giftActivity');
  });

  test('merge audit is top-level prefixed', () => {
    expect(COLLECTION_THEA_WEB_MERGE_AUDIT).toBe('theaWebMergeAudit');
  });
});

describe('Path builders return correct tuples', () => {
  test('user doc is /theaWebUser/{uid}', () => {
    expect(theaWebUserDocPath('uid1')).toEqual(['theaWebUser', 'uid1']);
  });

  test('recipient collection is /theaWebUser/{uid}/recipient', () => {
    expect(recipientCollectionPath('uid1')).toEqual([
      'theaWebUser',
      'uid1',
      'recipient',
    ]);
  });

  test('recipient doc is /theaWebUser/{uid}/recipient/{recipientId}', () => {
    expect(recipientDocPath('uid1', 'r1')).toEqual([
      'theaWebUser',
      'uid1',
      'recipient',
      'r1',
    ]);
  });

  test('recommendation collection is nested under recipient', () => {
    expect(recommendationCollectionPath('uid1', 'r1')).toEqual([
      'theaWebUser',
      'uid1',
      'recipient',
      'r1',
      'recommendation',
    ]);
  });

  test('recommendation doc has 6 segments', () => {
    const path = recommendationDocPath('uid1', 'r1', 'rec1');
    expect(path).toHaveLength(6);
    expect(path).toEqual([
      'theaWebUser',
      'uid1',
      'recipient',
      'r1',
      'recommendation',
      'rec1',
    ]);
  });

  test('gift activity collection is nested under recipient', () => {
    expect(giftActivityCollectionPath('uid1', 'r1')).toEqual([
      'theaWebUser',
      'uid1',
      'recipient',
      'r1',
      'giftActivity',
    ]);
  });

  test('gift activity doc uses productId as document id', () => {
    const path = giftActivityDocPath('uid1', 'r1', 'product-xyz');
    expect(path[5]).toBe('product-xyz');
  });

  test('merge audit paths are top-level', () => {
    expect(theaWebMergeAuditCollectionPath()).toEqual(['theaWebMergeAudit']);
    expect(theaWebMergeAuditDocPath('audit1')).toEqual([
      'theaWebMergeAudit',
      'audit1',
    ]);
  });
});

describe('Path tuples support spread into doc()/collection()', () => {
  // Smoke test: tuples must have an even segment count for doc() (path/id pairs)
  // and odd for collection().
  test('doc paths have even segment count', () => {
    expect(theaWebUserDocPath('u').length % 2).toBe(0);
    expect(recipientDocPath('u', 'r').length % 2).toBe(0);
    expect(recommendationDocPath('u', 'r', 'x').length % 2).toBe(0);
    expect(giftActivityDocPath('u', 'r', 'p').length % 2).toBe(0);
    expect(theaWebMergeAuditDocPath('a').length % 2).toBe(0);
  });

  test('collection paths have odd segment count', () => {
    expect(recipientCollectionPath('u').length % 2).toBe(1);
    expect(recommendationCollectionPath('u', 'r').length % 2).toBe(1);
    expect(giftActivityCollectionPath('u', 'r').length % 2).toBe(1);
    expect(theaWebMergeAuditCollectionPath().length % 2).toBe(1);
  });
});
