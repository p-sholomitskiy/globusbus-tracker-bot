import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSearchBackoff } from '../dist/parser/search-backoff.util.js';
import { getHtmlByFilter } from '../dist/parser/fetcher.parser.js';

test('exponential delay is capped, honors server delay, and gradually recovers', () => {
  let now = 0;
  const backoff = createSearchBackoff(() => now);
  for (const expectedDelay of [10000, 20000, 40000, 80000, 160000, 300000, 300000]) {
    backoff.recordFailure();
    assert.equal(backoff.getRemainingDelayMs(), expectedDelay);
    now += expectedDelay;
  }
  backoff.recordFailure('600');
  assert.equal(backoff.getRemainingDelayMs(), 600000);
  now += 600000;
  for (const expectedDelay of [150000, 75000, 37500, 18750, 9375, 0]) {
    backoff.recordSuccess();
    assert.equal(backoff.getRemainingDelayMs(), expectedDelay);
    now += expectedDelay;
  }
  backoff.recordFailure(new Date(now + 60000).toUTCString());
  assert.ok(backoff.getRemainingDelayMs() >= 59000);
});

test('429 pauses subsequent searches including other routes until retry-after elapses', async () => {
  let now = 0;
  let requestCount = 0;
  const backoff = createSearchBackoff(() => now);
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    globalThis.fetch = async () => {
      requestCount++;
      return requestCount === 1
        ? { ok: false, status: 429, headers: new Headers({ 'retry-after': '60' }) }
        : { ok: true, text: async () => '<html></html>' };
    };
    const filter = { pickup: 139, destination: 34, seats_limit: 1, date_of_journey: '24.10.2099' };
    assert.equal(await getHtmlByFilter(filter, backoff), null);
    assert.equal(await getHtmlByFilter({ ...filter, pickup: 140 }, backoff), null);
    assert.equal(requestCount, 1);
    now = 60000;
    assert.ok(await getHtmlByFilter(filter, backoff));
    assert.equal(requestCount, 2);
    assert.equal(backoff.getRemainingDelayMs(), 0);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});
