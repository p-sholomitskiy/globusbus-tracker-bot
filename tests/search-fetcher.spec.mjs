import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSearchBackoff } from '../dist/parser/search-backoff.util.js';
import { getHtmlByFilter } from '../dist/parser/fetcher.parser.js';

const filter = { pickup: 139, destination: 34, seats_limit: 1, date_of_journey: '28.10.2026' };
test('connection timeout retries successfully; persistent failure returns null; HTTP rejection is not retried', async () => {
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    let attemptCount = 0;
    globalThis.fetch = async () => {
      attemptCount++;
      if (attemptCount === 1) throw new TypeError('fetch failed', { cause: { code: 'UND_ERR_CONNECT_TIMEOUT' } });
      return { ok: true, text: async () => '<html>trips</html>' };
    };
    const response = await getHtmlByFilter(filter, createSearchBackoff());
    assert.equal(attemptCount, 2);
    assert.equal(response.html, '<html>trips</html>');
    assert.deepEqual(response.filter, filter);
    attemptCount = 0;
    globalThis.fetch = async () => { attemptCount++; throw new Error('unavailable'); };
    assert.equal(await getHtmlByFilter(filter, createSearchBackoff()), null);
    assert.equal(attemptCount, 2);
    attemptCount = 0;
    globalThis.fetch = async () => { attemptCount++; return { ok: false, status: 429, statusText: 'Too Many Requests' }; };
    assert.equal(await getHtmlByFilter(filter, createSearchBackoff()), null);
    assert.equal(attemptCount, 1);
  } finally {
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
  }
});
