import {
  THEA_WEB_CALLABLES,
  type TheaWebCallableName,
  type TheaWebMergeGiftFlowRequest,
  type TheaWebMergeGiftFlowResponse,
  type TheaWebRecordActivityRequest,
  type TheaWebRecordActivityResponse,
  type TheaWebSubmitGiftFlowRequest,
  type TheaWebSubmitGiftFlowResponse,
  type TheaWebUpdateRecipientRequest,
  type TheaWebUpdateRecipientResponse,
} from '../endpoints';

// These tests are about TYPE shape — most of the value comes from `tsc` rejecting
// any drift in the interfaces. We assert at runtime by constructing objects that
// the type system requires/forbids.

describe('Callable name registry', () => {
  test('all 4 callable names are exported and stable', () => {
    expect(THEA_WEB_CALLABLES.submitGiftFlow).toBe('theaWebSubmitGiftFlow');
    expect(THEA_WEB_CALLABLES.recordActivity).toBe('theaWebRecordActivity');
    expect(THEA_WEB_CALLABLES.updateRecipient).toBe('theaWebUpdateRecipient');
    expect(THEA_WEB_CALLABLES.mergeGiftFlow).toBe('theaWebMergeGiftFlow');
  });

  test('TheaWebCallableName union accepts each callable', () => {
    const names: TheaWebCallableName[] = [
      'theaWebSubmitGiftFlow',
      'theaWebRecordActivity',
      'theaWebUpdateRecipient',
      'theaWebMergeGiftFlow',
    ];
    expect(names).toHaveLength(4);
  });
});

describe('TheaWebSubmitGiftFlow request/response shape', () => {
  test('minimal valid request with required fields only compiles', () => {
    const req: TheaWebSubmitGiftFlowRequest = {
      recipient: { name: 'Mom', relationship: 'MOM' },
      input: { occasion: 'BIRTHDAY', interests: ['coffee'], freeform: 'plants' },
      mode: 'THOUGHTFUL',
    };
    expect(req.recipient.name).toBe('Mom');
    expect(req.recipient.recipientId).toBeUndefined();
  });

  test('regenerate request includes recipientId on recipient', () => {
    const req: TheaWebSubmitGiftFlowRequest = {
      recipient: {
        recipientId: 'r123',
        name: 'Mom',
        relationship: 'MOM',
      },
      input: { occasion: 'OTHER', occasionLabel: 'Friendsgiving', interests: [], freeform: '' },
      mode: 'FAST',
      marketingOptIn: true,
    };
    expect(req.recipient.recipientId).toBe('r123');
    expect(req.input.occasionLabel).toBe('Friendsgiving');
  });

  test('response status is the literal PROCESSING', () => {
    const res: TheaWebSubmitGiftFlowResponse = {
      recipientId: 'r1',
      recommendationId: '01HXXX',
      carouselSessionId: 'uid1_01HXXX',
      status: 'PROCESSING',
    };
    expect(res.status).toBe('PROCESSING');
    expect(res.carouselSessionId).toBe('uid1_01HXXX');
  });
});

describe('TheaWebRecordActivity request/response shape', () => {
  test('multi-recipient fanout request', () => {
    const req: TheaWebRecordActivityRequest = {
      productId: 'p1',
      state: 'SAVED',
      source: 'MULTI_RECIPIENT_MODAL',
      recipientIds: ['r1', 'r2', 'r3'],
    };
    expect(req.recipientIds).toHaveLength(3);
  });

  test('purchase records carry purchase details', () => {
    const req: TheaWebRecordActivityRequest = {
      productId: 'p1',
      state: 'PURCHASED',
      source: 'BOARD_VIEW',
      recipientIds: ['r1'],
      purchaseDetails: { price: 49.99, purchaseDate: '2026-04-25T00:00:00Z' },
    };
    expect(req.purchaseDetails?.price).toBe(49.99);
  });

  test('response includes resolved affiliate URL + per-recipient writes', () => {
    const res: TheaWebRecordActivityResponse = {
      affiliateUrl: 'https://sovrn.com/track?u=x',
      written: [
        { recipientId: 'r1', productId: 'p1', state: 'SAVED' },
        { recipientId: 'r2', productId: 'p1', state: 'SAVED' },
      ],
    };
    expect(res.written).toHaveLength(2);
  });
});

describe('TheaWebUpdateRecipient request/response shape', () => {
  test('partial update — only recipientId is required', () => {
    const req: TheaWebUpdateRecipientRequest = { recipientId: 'r1', name: 'Mom (renamed)' };
    expect(req.recipientId).toBe('r1');
  });

  test('archive flag is optional boolean', () => {
    const archive: TheaWebUpdateRecipientRequest = { recipientId: 'r1', archive: true };
    const unarchive: TheaWebUpdateRecipientRequest = { recipientId: 'r1', archive: false };
    expect(archive.archive).toBe(true);
    expect(unarchive.archive).toBe(false);
  });

  test('response returns ISO updatedAt string', () => {
    const res: TheaWebUpdateRecipientResponse = {
      recipientId: 'r1',
      updatedAt: '2026-04-25T12:00:00Z',
    };
    expect(typeof res.updatedAt).toBe('string');
  });
});

describe('TheaWebMergeGiftFlow request/response shape', () => {
  test('request requires fromUid + token', () => {
    const req: TheaWebMergeGiftFlowRequest = { fromUid: 'anon123', token: 'tok-xyz' };
    expect(req.fromUid).toBe('anon123');
  });

  test('NOOP response omits auditId and counts', () => {
    const res: TheaWebMergeGiftFlowResponse = { status: 'NOOP' };
    expect(res.status).toBe('NOOP');
    expect(res.auditId).toBeUndefined();
    expect(res.counts).toBeUndefined();
  });

  test('OK response includes counts and auditId', () => {
    const res: TheaWebMergeGiftFlowResponse = {
      status: 'OK',
      auditId: 'audit-1',
      counts: { recipients: 2, recommendations: 5, giftActivities: 12 },
    };
    expect(res.counts?.recipients).toBe(2);
    expect(res.auditId).toBe('audit-1');
  });
});
