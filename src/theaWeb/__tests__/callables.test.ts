// Smoke test: the four typed callable wrappers exist and are callable.
// Real wire behavior is verified via emulator E2E + the schemas/endpoints
// type contract in `schemas/__tests__/endpoints.test.ts`.

jest.mock('../../firebaseFunctions', () => ({
  functions: {},
}));

jest.mock('firebase/functions', () => {
  const httpsCallable = jest.fn((_funcs, name: string) => {
    const fn: any = jest.fn();
    fn.__name = name;
    return fn;
  });
  return { httpsCallable };
});

describe('theaWeb callables', () => {
  test('exports four typed callable wrappers wired to THEA_WEB_CALLABLES names', async () => {
    const { submitGiftFlow, recordActivity, updateRecipient, mergeGiftFlow } = await import(
      '../callables'
    );

    expect(typeof submitGiftFlow).toBe('function');
    expect(typeof recordActivity).toBe('function');
    expect(typeof updateRecipient).toBe('function');
    expect(typeof mergeGiftFlow).toBe('function');

    expect((submitGiftFlow as any).__name).toBe('theaWebSubmitGiftFlow');
    expect((recordActivity as any).__name).toBe('theaWebRecordActivity');
    expect((updateRecipient as any).__name).toBe('theaWebUpdateRecipient');
    expect((mergeGiftFlow as any).__name).toBe('theaWebMergeGiftFlow');
  });
});
