import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Bot } from 'grammy';
import { supabase } from '../dist/db/client.repo.js';
import { subscriptionEditComposer } from '../dist/bot/subscription-edit.bot.js';
const subscription = { id: 42, chat_id: 123, pickup: 139, destination: 34,
  date_of_journey: '24.10.2099', seats_limit: 1, time_list: ['7:40'], status: 'pending' };
supabase.from = (table) => {
  if (table === 'locations') return { select: async () => ({ data: [], error: null }) };
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { ...subscription }, error: null }) };
  return query;
};
const bot = new Bot('123:test', { botInfo: { id: 1, is_bot: true, first_name: 'Test', username: 'test_bot',
  can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false } });
let enteredScene;
const session = {};
bot.api.config.use(async () => ({ ok: true, result: true }));
bot.use(async (ctx, next) => {
  ctx.session = session;
  ctx.scenes = { abort: async () => {}, enter: async (scene) => { enteredScene = scene; } };
  await next();
});
bot.use(subscriptionEditComposer);
test('edit opens time scene with original route and selections, without saving before confirmation', async () => {
  await bot.handleUpdate({ update_id: 1, callback_query: { id: 'edit', chat_instance: 'test',
    from: { id: 123, is_bot: false, first_name: 'User' }, data: 'subscription-edit:42',
    message: { message_id: 2, date: 1, chat: { id: 123, type: 'private' }, text: 'Subscription' } } });
  assert.equal(enteredScene, 'timePickerScene');
  assert.equal(session.tripRequestFilter.pickup, 139);
  assert.equal(session.tripRequestFilter.date_of_journey, '24.10.2099');
  assert.deepEqual(session.tripTimeList.selected, ['7:40']);
  assert.equal(subscription.status, 'pending');
});
