import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Bot } from 'grammy';
import { supabase } from '../dist/db/client.repo.js';
import { subscriptionListComposer } from '../dist/bot/subscription-list.bot.js';

const subscription = { id: 42, chat_id: 123, pickup: 139, destination: 34,
  date_of_journey: '24.10.2099', seats_limit: 1, time_list: ['7:40'], status: 'active' };
const locationList = [{ value: 139, name: 'Минск', point: 'pickup' },
  { value: 34, name: 'Столин', point: 'destination' }];
let extraSubscriptionList = [];
let isConflict = false;
supabase.from = (table) => {
  const filterMap = new Map();
  let updateParams;
  const getResponse = () => {
    if (table === 'locations') return { data: locationList, error: null };
    if (updateParams && isConflict) return { data: [], error: { code: '23505', message: 'duplicate key' } };
    const isMatching = [...filterMap].every(([key, value]) => String(subscription[key]) === String(value));
    if (isMatching && updateParams) Object.assign(subscription, updateParams);
    const extraMatchList = updateParams ? [] : extraSubscriptionList.filter(currentSubscription =>
      [...filterMap].every(([key, value]) => String(currentSubscription[key]) === String(value)));
    return { data: [...(isMatching ? [{ ...subscription }] : []), ...extraMatchList], error: null };
  };
  const query = {
    select: () => query, eq: (key, value) => { filterMap.set(key, value); return query; },
    update: (params) => { updateParams = params; return query; },
    maybeSingle: async () => { const response = getResponse(); return { ...response, data: response.data[0] ?? null }; },
    then: (resolve, reject) => Promise.resolve(getResponse()).then(resolve, reject),
  };
  return query;
};
const bot = new Bot('123:test', { botInfo: { id: 1, is_bot: true, first_name: 'Test', username: 'test_bot',
  can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false } });
let isSceneReached = false;
const requestList = [];
bot.api.config.use(async (_previous, method, payload) => {
  requestList.push({ method, payload });
  return { ok: true, result: true };
});
bot.use(subscriptionListComposer);
bot.use(() => { isSceneReached = true; });
const sendCommand = (chatId = 123) => bot.handleUpdate({ update_id: 1, message: {
  message_id: 1, date: 1, chat: { id: chatId, type: 'private' },
  from: { id: chatId, is_bot: false, first_name: 'User' },
  text: '/subscriptions', entities: [{ type: 'bot_command', offset: 0, length: 14 }],
} });
const clickData = (data, chatId = 123) => bot.handleUpdate({ update_id: 2, callback_query: {
  id: 'callback', chat_instance: 'test', from: { id: chatId, is_bot: false, first_name: 'User' },
  message: { message_id: 2, date: 1, chat: { id: chatId, type: 'private' }, text: 'Subscription' },
  data,
} });

const click = (action, status = 'active', chatId = 123) => clickData(`subscription-list:${action}:${status}:42`, chatId);

test('list shows route and controls, cancellation works before scenes, stale and foreign controls are rejected', async () => {
  await sendCommand();
  assert.equal(isSceneReached, false);
  const card = requestList.find(request => request.payload.text?.includes('Минск → Столин'));
  assert.ok(card);
  assert.match(card.payload.text, /Отслеживается/);
  assert.equal(card.payload.reply_markup.inline_keyboard[0][0].callback_data, 'subscription-edit:42');
  assert.equal(card.payload.reply_markup.inline_keyboard[1][0].callback_data, 'subscription-list:cancel:active:42');
  await click('cancel', 'active', 999);
  assert.equal(subscription.status, 'active');
  await click('cancel');
  assert.equal(subscription.status, 'canceled');
  assert.ok(requestList.some(request => request.method === 'editMessageText' && request.payload.text.includes('Прекращена')));
  await click('resume', 'pending');
  assert.equal(subscription.status, 'canceled');
  subscription.status = 'pending';
  await click('resume', 'pending');
  assert.equal(subscription.status, 'active');
  requestList.length = 0;
  await sendCommand(999);
  assert.ok(requestList.some(request => request.payload.text?.includes('нет активных подписок')));
});


test('legacy subscription with null time_list remains visible and can be canceled', async () => {
  subscription.time_list = null;
  subscription.status = 'active';
  requestList.length = 0;
  await sendCommand();
  assert.ok(requestList.some(request => request.payload.text?.includes('Не выбрано')));
  assert.ok(!requestList.some(request => request.payload.text?.includes('Не удалось')));
  await click('cancel');
  assert.equal(subscription.status, 'canceled');
});


test('only active and pending subscriptions with a current journey date are listed', async () => {
  subscription.time_list = ['7:40'];
  for (const [status, date, isVisible] of [
    ['canceled', '24.10.2099', false],
    ['expired', '24.10.2099', false],
    ['active', '01.01.2000', false],
    ['pending', '01.01.2000', false],
    ['active', '24.10.2099', true],
    ['pending', '24.10.2099', true],
  ]) {
    subscription.status = status;
    subscription.date_of_journey = date;
    requestList.length = 0;
    await sendCommand();
    const cardList = requestList.filter(request => request.payload.text?.includes('Минск → Столин'));
    assert.equal(cardList.length, isVisible ? 1 : 0, `${status}, ${date}`);
    if (!isVisible) assert.ok(requestList.some(request => request.payload.text?.includes('нет активных подписок')));
    assert.equal(subscription.status, status, 'listing must not mutate stored status');
  }
});


test('canceled list restores valid subscriptions and rejects duplicates, missing times, past dates and repeated clicks', async () => {
  subscription.status = 'canceled';
  subscription.date_of_journey = '24.10.2099';
  subscription.time_list = ['7:40'];
  requestList.length = 0;
  await sendCommand();
  assert.ok(requestList.some(request => request.payload.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data === 'subscription-list:canceled'));
  await clickData('subscription-list:canceled');
  assert.ok(requestList.some(request => request.payload.reply_markup?.inline_keyboard?.[0]?.[0]?.callback_data === 'subscription-list:restore:canceled:42'));
  await click('restore', 'canceled', 999);
  assert.equal(subscription.status, 'canceled');
  extraSubscriptionList = [{ ...subscription, id: 43, status: 'pending' }];
  await click('restore', 'canceled');
  assert.equal(subscription.status, 'canceled');
  extraSubscriptionList = [];
  subscription.time_list = null;
  await click('restore', 'canceled');
  assert.equal(subscription.status, 'canceled');
  subscription.time_list = ['7:40'];
  subscription.date_of_journey = '01.01.2000';
  await click('restore', 'canceled');
  assert.equal(subscription.status, 'canceled');
  subscription.date_of_journey = '24.10.2099';
  await click('restore', 'canceled');
  assert.equal(subscription.status, 'active');
  assert.deepEqual(subscription.time_list, ['7:40']);
  await click('restore', 'canceled');
  assert.equal(subscription.status, 'active');
});


test('canceled cards group identical searches irrespective of time order and retain different preferences', async () => {
  subscription.status = 'canceled';
  subscription.time_list = ['7:40', '11:20'];
  extraSubscriptionList = [
    { ...subscription, id: 43, time_list: ['11:20', '7:40'] },
    { ...subscription, id: 44, time_list: ['12:00'] },
    { ...subscription, id: 45, seats_limit: 2 },
  ];
  requestList.length = 0;
  await clickData('subscription-list:canceled');
  const cardList = requestList.filter(request => request.payload.text?.includes('Минск → Столин'));
  assert.equal(cardList.length, 3);
  const callbackList = cardList.map(request => request.payload.reply_markup.inline_keyboard[0][0].callback_data);
  assert.ok(callbackList.includes('subscription-list:restore:canceled:43'));
  assert.ok(!callbackList.includes('subscription-list:restore:canceled:42'));
  assert.deepEqual(subscription.time_list, ['7:40', '11:20']);
  extraSubscriptionList = [];
});


test('restore race conflict displays an explanatory alert and leaves subscription canceled', async () => {
  subscription.status = 'canceled';
  subscription.time_list = ['7:40'];
  subscription.date_of_journey = '24.10.2099';
  extraSubscriptionList = [];
  isConflict = true;
  requestList.length = 0;
  try {
    await click('restore', 'canceled');
    assert.equal(subscription.status, 'canceled');
    const alert = requestList.find(request => request.method === 'answerCallbackQuery' && request.payload.show_alert);
    assert.ok(alert);
    assert.match(alert.payload.text, /уже есть действующая подписка/);
    assert.ok(!requestList.some(request => request.method === 'editMessageText'));
  } finally {
    isConflict = false;
  }
});
