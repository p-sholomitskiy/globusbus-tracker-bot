import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { supabase } from '../dist/db/client.repo.js';
import { startTrackingScheduler, stopTrackingScheduler } from '../dist/scheduler/tracking.scheduler.js';

test('stop cancels queued pass, waits for current request, and skips remaining subscriptions', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const originalFetch = globalThis.fetch;
  const originalFrom = supabase.from;
  let resolveHtml;
  const htmlPromise = new Promise(resolve => { resolveHtml = resolve; });
  let requestCount = 0;
  let listCount = 0;
  supabase.from = () => ({ select: async () => {
    listCount++;
    return { data: [1, 2].map(id => ({ id, chat_id: 123, status: 'active',
      pickup: id, destination: 34, date_of_journey: '24.10.2099', seats_limit: 1, time_list: ['7:40'] })), error: null };
  } });
  globalThis.fetch = async () => { requestCount++; return { ok: true, text: async () => htmlPromise }; };
  try {
    startTrackingScheduler();
    await stopTrackingScheduler();
    context.mock.timers.tick(10000);
    assert.equal(listCount, 0);
    startTrackingScheduler();
    startTrackingScheduler();
    context.mock.timers.tick(5000);
    await setImmediate();
    assert.equal(listCount, 1);
    assert.equal(requestCount, 1);
    let isStopped = false;
    const stopPromise = stopTrackingScheduler().then(() => { isStopped = true; });
    await setImmediate();
    assert.equal(isStopped, false);
    resolveHtml('<html></html>');
    await stopPromise;
    assert.equal(requestCount, 1);
    context.mock.timers.tick(600000);
    await setImmediate();
    assert.equal(listCount, 1);
  } finally {
    resolveHtml('<html></html>');
    await stopTrackingScheduler();
    globalThis.fetch = originalFetch;
    supabase.from = originalFrom;
    context.mock.timers.reset();
  }
});

test('idle and paused passes stay quiet; active tracking emits summary; database errors remain visible', async (context) => {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const originalFrom = supabase.from;
  const originalFetch = globalThis.fetch;
  const logList = [];
  const errorList = [];
  context.mock.method(console, 'log', (...args) => { logList.push(args); });
  context.mock.method(console, 'error', (...args) => { errorList.push(args); });
  let subscriptionList = [];
  let databaseError = null;
  supabase.from = () => ({ select: async () => ({ data: databaseError ? null : subscriptionList, error: databaseError }) });
  globalThis.fetch = async () => ({ ok: true, text: async () => '<html></html>' });
  const subscription = { id: 1, chat_id: 123, pickup: 139, destination: 34,
    date_of_journey: '24.10.2099', seats_limit: 1, time_list: ['7:40'] };
  try {
    startTrackingScheduler();
    for (const status of [null, 'pending', 'canceled', 'expired', 'active']) {
      subscriptionList = status ? [{ ...subscription, status }] : [];
      context.mock.timers.tick(5000);
      await setImmediate();
      assert.equal(logList.length, status === 'active' ? 1 : 0);
    }
    assert.match(logList[0][0], /подписок 1, уникальных поисков 1/);
    databaseError = { message: 'database unavailable' };
    context.mock.timers.tick(5000);
    await setImmediate();
    assert.equal(logList.length, 1);
    assert.equal(errorList.length, 1);
  } finally {
    await stopTrackingScheduler();
    supabase.from = originalFrom;
    globalThis.fetch = originalFetch;
    context.mock.timers.reset();
  }
});
