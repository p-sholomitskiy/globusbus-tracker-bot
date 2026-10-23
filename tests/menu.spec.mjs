import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Bot } from 'grammy';
import { menuComposer, MENU_BUTTON } from '../dist/bot/menu.bot.js';

const bot = new Bot('123:test', { botInfo: { id: 1, is_bot: true, first_name: 'Test', username: 'test_bot',
  can_join_groups: false, can_read_all_group_messages: false, supports_inline_queries: false } });
const requestList = [];
let abortCount = 0;
let enteredScene;
let isSceneReached = false;
let session = { currentSceneIndex: 3, tripTimeList: { selected: ['10:00'] } };
bot.api.config.use(async (_previous, method, payload) => {
  requestList.push({ method, payload });
  return { ok: true, result: true };
});
bot.use(async (ctx, next) => {
  ctx.session = session;
  ctx.scenes = { abort: async () => { abortCount++; }, enter: async (scene) => { enteredScene = scene; } };
  await next();
});
bot.use(menuComposer);
bot.use(() => { isSceneReached = true; });
const sendText = (text) => bot.handleUpdate({ update_id: 1, message: {
  message_id: 1, date: 1, chat: { id: 123, type: 'private' },
  from: { id: 123, is_bot: false, first_name: 'User' }, text,
  ...(text.startsWith('/') ? { entities: [{ type: 'bot_command', offset: 0, length: text.length }] } : {}),
} });

test('help preserves selection, menu starts fresh search, start shows welcome and persistent keyboard', async () => {
  await sendText(MENU_BUTTON.help);
  assert.equal(isSceneReached, false);
  assert.equal(abortCount, 0);
  assert.deepEqual(session.tripTimeList.selected, ['10:00']);
  assert.ok(requestList.some(request => request.payload.text?.includes('не бронирует')));
  await sendText(MENU_BUTTON.track);
  assert.equal(abortCount, 1);
  assert.equal(session.currentSceneIndex, 0);
  assert.deepEqual(session.tripTimeList.selected, []);
  assert.ok(enteredScene);
  await sendText('/start');
  assert.equal(abortCount, 2);
  const welcome = requestList.at(-1).payload;
  assert.match(welcome.text, /Globusbus/);
  assert.equal(welcome.reply_markup.is_persistent, true);
  assert.equal(welcome.reply_markup.resize_keyboard, true);
  assert.equal(welcome.reply_markup.keyboard[0][0].text, MENU_BUTTON.track);
});
