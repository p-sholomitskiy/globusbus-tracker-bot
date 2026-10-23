import assert from 'node:assert/strict';
import { test } from 'node:test';
import { supabase } from '../dist/db/client.repo.js';
import { createTrackingSubscription, updateTrackingSubscription, changeTrackingSubscriptionStatus } from '../dist/db/tracking-subscription.repo.js';
import { isSubscriptionConflict } from '../dist/db/tracking-subscription-error.util.js';

test('all subscription writes preserve unique constraint conflicts for user-facing handling', async () => {
  const conflict = { code: '23505', message: 'duplicate key' };
  const query = { insert: () => query, update: () => query, select: () => query, eq: () => query,
    single: async () => ({ data: null, error: conflict }),
    maybeSingle: async () => ({ data: null, error: conflict }) };
  supabase.from = () => query;
  await assert.rejects(createTrackingSubscription({}), isSubscriptionConflict);
  await assert.rejects(updateTrackingSubscription(42, { status: 'active' }), isSubscriptionConflict);
  await assert.rejects(changeTrackingSubscriptionStatus(42, 123, 'canceled', 'active'), isSubscriptionConflict);
  assert.equal(isSubscriptionConflict(new Error('timeout')), false);
  assert.equal(isSubscriptionConflict(null), false);
  assert.equal(isSubscriptionConflict({ code: '42501' }), false);
});
