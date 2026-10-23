import { searchBackoff } from './search-backoff.util.js';
import { SUPERBUS_SEARCH_URL } from '../constants.js';
import type { TripRequestFilter } from '../models/trip.model.js';
import type { FetchResult } from '../models/parser.model.js';
import { setTimeout as delay } from 'node:timers/promises';

const SEARCH_REQUEST_TIMEOUT_MS = 15000;
const SEARCH_RETRY_DELAY_MS = 1000;
const SEARCH_ATTEMPT_COUNT = 2;

export const getHtmlByFilter = async (filterPayload: TripRequestFilter, backoff = searchBackoff): Promise<FetchResult | null> => {
  if (backoff.getRemainingDelayMs() > 0) return null;
  const filterParams = new URLSearchParams(Object.entries(filterPayload)
    .map(([key, value]) => [key, String(value ?? '')]));
  for (let attemptIndex = 0; attemptIndex < SEARCH_ATTEMPT_COUNT; attemptIndex++) {
    try {
      const response = await fetch(`${SUPERBUS_SEARCH_URL}?${filterParams}`, {
        signal: AbortSignal.timeout(SEARCH_REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500) {
          backoff.recordFailure(response.headers?.get('retry-after') ?? null);
        }
        console.error(`Search HTTP error: ${response.status} ${response.statusText}`);
        return null;
      }
      const html = await response.text();
      backoff.recordSuccess();
      return { html, filter: filterPayload };
    } catch (error) {
      const fetchError = error as { name?: string; cause?: { code?: string }; message?: string };
      console.error(`Search attempt ${attemptIndex + 1} failed:`, fetchError.cause?.code ?? fetchError.name ?? fetchError.message);
      if (attemptIndex + 1 < SEARCH_ATTEMPT_COUNT) await delay(SEARCH_RETRY_DELAY_MS);
    }
  }
  backoff.recordFailure();
  return null;
};
