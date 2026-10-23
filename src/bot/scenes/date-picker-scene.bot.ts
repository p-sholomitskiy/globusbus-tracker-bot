import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { createInlineKeyboardWithDates } from '../components/inline-keyboard-date-pick.bot.js';
import { deleteKeyboardMessage, isActualCallback } from '../utils.bot.js';
import { BOT_MESSAGES } from '../messages.bot.js';

export const datePickerScene = new Scene<BotCustomContext>(
  BotSceneNameList.DATE_PICKER_SCENE,
);

datePickerScene.label(BotInlineKeyboardCommands.search_again.callbackData);

datePickerScene.step(async (ctx) => {
  const datesKeyboard = createInlineKeyboardWithDates();

  const keyboardMessage = await ctx.reply(BOT_MESSAGES.SELECT_DATE, {
    reply_markup: datesKeyboard,
  });

  ctx.session.keyboardMessageId = keyboardMessage.message_id;
  ctx.session.chatId = keyboardMessage.chat.id;

  ctx.scene.resume();
});

datePickerScene.wait('chooseDate').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
  const selectedButtonData = ctx.callbackQuery.data;

  if (!isActualCallback(ctx)) {
    await deleteKeyboardMessage(ctx);
    return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
  }

  ctx.session.selectedOptions.date = selectedButtonData;
  ctx.session.tripRequestFilter.date_of_journey = selectedButtonData;

  const router = await sceneRouter(ctx);

  await ctx.editMessageText(`${BOT_MESSAGES.CHOSEN_DATE}: ${selectedButtonData}`);

  const nextScene = router.next();

  if (nextScene === null) {
    return ctx.scene.exit();
  }

  return ctx.scene.enter(nextScene);
});
