// PLAYGROUND STUB — replaces real Cloud Functions callables with no-ops.
// Real version at upstream:src/firebaseFunctions.ts. Never port this back.

const noop = async (_args?: unknown) => ({ data: undefined });

export const getCarouselFeed = noop as unknown as (
  args: unknown,
) => Promise<{ data: unknown }>;

export const getFastCarouselFeed = noop as unknown as (
  args: unknown,
) => Promise<{ data: unknown }>;

export const functions = {} as unknown;
