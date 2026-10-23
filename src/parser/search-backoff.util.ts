const INITIAL_RETRY_DELAY_MS = 10000;
const MAX_RETRY_DELAY_MS = 300000;
const NORMAL_RETRY_DELAY_MS = 5000;

export const createSearchBackoff = (getCurrentTime: () => number = Date.now) => {
  let retryDelayMs = 0;
  let nextRequestAt = 0;
  return {
    getRemainingDelayMs: (): number => Math.max(0, nextRequestAt - getCurrentTime()),
    recordFailure: (retryAfter: string | null = null): void => {
      retryDelayMs = Math.min(MAX_RETRY_DELAY_MS, Math.max(INITIAL_RETRY_DELAY_MS, retryDelayMs * 2));
      const retryAfterSeconds = retryAfter === null ? NaN : Number(retryAfter);
      const retryAfterMs = Number.isFinite(retryAfterSeconds)
        ? Math.max(0, retryAfterSeconds * 1000)
        : Math.max(0, Date.parse(retryAfter ?? '') - getCurrentTime()) || 0;
      nextRequestAt = getCurrentTime() + Math.max(retryDelayMs, retryAfterMs);
    },
    recordSuccess: (): void => {
      retryDelayMs = Math.floor(retryDelayMs / 2);
      if (retryDelayMs <= NORMAL_RETRY_DELAY_MS) retryDelayMs = 0;
      nextRequestAt = getCurrentTime() + retryDelayMs;
    },
  };
};

export const searchBackoff = createSearchBackoff();
