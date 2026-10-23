import { InlineKeyboard } from 'grammy';
import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { getHtmlByFilter } from '../../parser/fetcher.parser.js';
import { performParse } from '../../parser/performer.parser.js';
import { deleteKeyboardMessage, isActualCallback, sessionMessageHistory } from '../utils.bot.js';
import { BOT_MESSAGES } from '../messages.bot.js';
import type { TripListItem } from '../../models/trip.model.js';
import { createInlineKeyboardWithTripTime } from '../components/inline-keyboard-time-pick.bot.js';
import { sceneRouter } from './router.bot.js';

export const timePickerScene = new Scene<BotCustomContext>(BotSceneNameList.TIME_PICKER_SCENE);

timePickerScene.label(BotInlineKeyboardCommands.search_again.callbackData);

timePickerScene.step(async (ctx) => {

  const { pickup, destination, date_of_journey, seats_limit } = ctx.session.tripRequestFilter;

  const fetchedHTML = await getHtmlByFilter({
    pickup,
    destination,
    date_of_journey,
    seats_limit,
  });

  if (!fetchedHTML) {
    const keyboardMessage = await ctx.reply('Не удалось подключиться к сайту Globusbus. Параметры поиска сохранены. Попробуйте ещё раз.', {
      reply_markup: new InlineKeyboard().text('🔄 Повторить поиск', 'retry_trip_search'),
    });
    ctx.session.keyboardMessageId = keyboardMessage.message_id;
    ctx.session.chatId = keyboardMessage.chat.id;

    return;
  }

  const tripList = performParse(fetchedHTML);

  if (!tripList.length) {
    const keyboardMessage = await ctx.reply('На выбранную дату рейсы не найдены. Можно повторить поиск или выбрать другой рейс через /track.', {
      reply_markup: new InlineKeyboard().text('🔄 Повторить поиск', 'retry_trip_search'),
    });
    ctx.session.keyboardMessageId = keyboardMessage.message_id;
    ctx.session.chatId = keyboardMessage.chat.id;
    return;
  }

  const { tripTimeList } = ctx.session;

  tripTimeList.fetched = tripList.map((trip: TripListItem) => trip.startTime);

  const tripTimeKeyboard = createInlineKeyboardWithTripTime(tripTimeList.fetched, tripTimeList.selected);

  const keyboardMessage = await ctx.reply(BOT_MESSAGES.SELECT_TIME, {
    reply_markup: tripTimeKeyboard,
  });

  ctx.session.keyboardMessageId = keyboardMessage.message_id;
  ctx.session.chatId = keyboardMessage.chat.id;
});

timePickerScene.wait('handleTimePicker').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
  const selectedButtonData = ctx.callbackQuery.data;
  sessionMessageHistory(ctx).addMessage(ctx.callbackQuery.message?.message_id);

  if (!isActualCallback(ctx)) {
    await deleteKeyboardMessage(ctx);
    return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
  }

  if (selectedButtonData === 'retry_trip_search') {
    await deleteKeyboardMessage(ctx);
    return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
  }

  const { tripTimeList, selectedOptions } = ctx.session;

  if (selectedButtonData === BotInlineKeyboardCommands.confirm.callbackData) {
    if (!tripTimeList.selected.length) {
      await ctx.reply('Выберите хотя бы одно время отправления.');
      return;
    }
    selectedOptions.time = tripTimeList.selected;

    const router = await sceneRouter(ctx);

    await ctx.editMessageText(`${BOT_MESSAGES.SELECTED_TIME}: ${selectedOptions.time.join(', ')}`);

    const nextScene = router.next();

    if (nextScene === null) {
      return ctx.scene.exit();
    }

    return ctx.scene.enter(nextScene);
  }

  if (!tripTimeList.fetched.includes(selectedButtonData)) return;

  const selectedTripTimeIndex = tripTimeList.selected.indexOf(selectedButtonData);

  if (selectedTripTimeIndex >= 0) {
    tripTimeList.selected.splice(selectedTripTimeIndex, 1);
  } else {
    tripTimeList.selected.push(selectedButtonData);
  }

  const updatedKeyboard = createInlineKeyboardWithTripTime(tripTimeList.fetched, tripTimeList.selected);

  await ctx.editMessageReplyMarkup({
    reply_markup: updatedKeyboard,
  });

});
