import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findMatchingSubscription } from '../dist/bot/subscription-match.bot.js';
const request = { chat_id: 123, pickup: 139, destination: 34, date_of_journey: '24.10.2099',
  time_list: ['7:40', '11:20'], seats_limit: 1, status: 'active' };
const record = (id, status, overrides = {}) => ({ ...request, id, status, ...overrides });
test('existing active or paused route wins; identical canceled search restores latest; other searches stay separate', () => {
  assert.equal(findMatchingSubscription([record(1, 'active'), record(2, 'canceled')], request).id, 1);
  assert.equal(findMatchingSubscription([record(3, 'pending', { time_list: ['12:00'] })], request).id, 3);
  assert.equal(findMatchingSubscription([record(1, 'canceled'), record(2, 'canceled', { time_list: ['11:20', '7:40'] })], request).id, 2);
  for (const overrides of [{ seats_limit: 2 }, { time_list: ['12:00'] }, { time_list: null },
    { chat_id: 999 }, { destination: 99 }, { date_of_journey: '25.10.2099' }]) {
    assert.equal(findMatchingSubscription([record(1, 'canceled', overrides)], request), undefined);
  }
  assert.equal(findMatchingSubscription([record(1, 'expired')], request), undefined);
  assert.equal(findMatchingSubscription([], request), undefined);
});
