import assert from 'node:assert/strict';
import { test } from 'node:test';
import { bot } from '../dist/bot/app.bot.js';
import { supabase } from '../dist/db/client.repo.js';
import { checkTrackingSubscription } from '../dist/scheduler/tracking.service.js';
import { subscriptionComposer } from '../dist/bot/subscription.bot.js';

const subscription = {
  id: 42, chat_id: 123, pickup: 139, destination: 34,
  date_of_journey: '24.10.2099', seats_limit: 1,
  time_list: ['7:40'], status: 'active',
};

// No real HTTP requests or database writes in these tests.
let fetchCount = 0;
globalThis.fetch = async () => { fetchCount++; return ({ ok: true, text: async () => `
  <article class="tickets-item">
    <div class="tickets-way__point-time">7:40</div>
    <div class="tickets-way__point-time">12:06</div>
    <div class="tickets-about__stay">Свободно мест: 1</div>
  </article>` }); };
let isDatabaseFailed = false;
let sentCount = 0;
let isSendFailed = false;
supabase.from = (table) => {
  if (table === 'locations') return { select: async () => ({ data: [
    { value: 139, point: 'pickup', name: 'Минск' },
    { value: 34, point: 'destination', name: 'Столин' },
  ], error: null }) };
  let updateParams;
  const filterMap = new Map();
  const query = {
    select: () => query,
    update: (params) => { updateParams = params; return query; },
    eq: (key, value) => { filterMap.set(key, value); return query; },
    maybeSingle: async () => {
      if (isDatabaseFailed && updateParams) return { data: null, error: new Error('database unavailable') };
      const isMatching = [...filterMap].every(([key, value]) => subscription[key] === value);
      if (!isMatching) return { data: null, error: null };
      if (updateParams) Object.assign(subscription, updateParams);
      return { data: { ...subscription }, error: null };
    },
  };
  return query;
};
bot.api.sendMessage = async (_chatId, text, options) => {
  if (isSendFailed) throw new Error('Telegram unavailable');
  assert.equal(subscription.status, 'active');
  assert.match(text, /Минск → Столин/);
  assert.match(text, /7:40 — свободных мест: 1/);
  const searchUrl = new URL(options.reply_markup.inline_keyboard[0][0].url);
  assert.equal(searchUrl.origin, 'https://globusbus.by');
  assert.equal(searchUrl.searchParams.get('pickup'), '139');
  assert.equal(searchUrl.searchParams.get('date_of_journey'), subscription.date_of_journey);
  assert.match(options.reply_markup.inline_keyboard[1][0].callback_data, /subscription:resume:42/);
  sentCount++;
  return { message_id: sentCount };
};

const click = async (action, chatId = 123) => {
  let answer;
  let editedText;
  let isSceneReached = false;
  const context = {
    callbackQuery: { data: `subscription:${action}:42`, message: { text: "🚍 Появились места на: \n\n24.10.2099 7:40\n\nОтслеживание приостановлено. Продолжить?" } },
    update: { callback_query: { data: `subscription:${action}:42` } },
    chat: { id: chatId, type: 'private' }, from: { id: chatId },
    has: () => true,
    answerCallbackQuery: async (options) => { answer = options.text; },
    editMessageReplyMarkup: async () => {},
    editMessageText: async (text, options) => {
      editedText = text;
      assert.deepEqual(options.reply_markup.inline_keyboard, []);
    },
  };
  await subscriptionComposer.middleware()(context, async () => { isSceneReached = true; });
  assert.equal(isSceneReached, false);
  if (editedText) {
    assert.match(editedText, /24.10.2099 7:40/);
    assert.doesNotMatch(editedText, /Продолжить\?/);
    assert.match(editedText, subscription.status === "active" ? /✅ Отслеживание продолжено/
      : subscription.status === "canceled" ? /⏹ Отслеживание прекращено/ : /Дата поездки прошла/);
  }
  if (answer === "Отслеживание продолжено." || answer === "Отслеживание прекращено."
    || answer === "Дата поездки прошла. Подписка завершена.") assert.ok(editedText);
  return answer;
};

test('one seat, retry database update without resending, ownership, resume, cancel, expiry', async () => {
  isSendFailed = true;
  await assert.rejects(checkTrackingSubscription(subscription), /Telegram unavailable/);
  assert.equal(subscription.status, 'active');
  isSendFailed = false;
  isDatabaseFailed = true;
  await assert.rejects(checkTrackingSubscription(subscription), /database unavailable/);
  assert.equal(sentCount, 1);
  isDatabaseFailed = false;
  await checkTrackingSubscription(subscription);
  assert.equal(sentCount, 1);
  assert.equal(subscription.status, 'pending');
  await click('resume', 999);
  assert.equal(subscription.status, 'pending');
  await click('resume');
  assert.equal(subscription.status, 'active');
  await click('cancel');
  assert.equal(subscription.status, 'active');
  await checkTrackingSubscription(subscription);
  assert.equal(sentCount, 2);
  await click('cancel');
  assert.equal(subscription.status, 'canceled');
  subscription.status = 'pending';
  subscription.date_of_journey = '01.01.2000';
  await click('resume');
  assert.equal(subscription.status, 'expired');
});


test('identical searches share one response, cache expires each pass, canceled subscription is skipped', async () => {
  subscription.status = 'active';
  subscription.date_of_journey = '24.10.2099';
  const searchTripListMap = new Map();
  const initialFetchCount = fetchCount;
  const initialSentCount = sentCount;
  await checkTrackingSubscription({ ...subscription }, searchTripListMap);
  subscription.status = 'active';
  await checkTrackingSubscription({ ...subscription }, searchTripListMap);
  assert.equal(fetchCount - initialFetchCount, 1);
  assert.equal(sentCount - initialSentCount, 2);
  subscription.status = 'active';
  await checkTrackingSubscription({ ...subscription }, new Map());
  assert.equal(fetchCount - initialFetchCount, 2);
  const staleSubscription = { ...subscription, status: 'active' };
  subscription.status = 'canceled';
  const sentBeforeCancelCheck = sentCount;
  await checkTrackingSubscription(staleSubscription, searchTripListMap);
  assert.equal(sentCount, sentBeforeCancelCheck);
});


test('legacy subscription without selected times does not fetch or send', async () => {
  const initialFetchCount = fetchCount;
  const initialSentCount = sentCount;
  await checkTrackingSubscription({ ...subscription, status: 'active', time_list: null });
  await checkTrackingSubscription({ ...subscription, status: 'active', time_list: [] });
  assert.equal(fetchCount, initialFetchCount);
  assert.equal(sentCount, initialSentCount);
});
