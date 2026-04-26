export * from './theaWebSubmitGiftFlow';
export * from './theaWebRecordActivity';
export * from './theaWebUpdateRecipient';
export * from './theaWebMergeGiftFlow';

// Callable function names — keep in sync with `thea-serverless/functions/main.py`.
export const THEA_WEB_CALLABLES = {
  submitGiftFlow: 'theaWebSubmitGiftFlow',
  recordActivity: 'theaWebRecordActivity',
  updateRecipient: 'theaWebUpdateRecipient',
  mergeGiftFlow: 'theaWebMergeGiftFlow',
} as const;

export type TheaWebCallableName = (typeof THEA_WEB_CALLABLES)[keyof typeof THEA_WEB_CALLABLES];
