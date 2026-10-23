import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { createInlineKeyboardWithIntervals } from '../components/inline-keyboard-interval-pick.bot.js';
import { deleteKeyboardMessage, isActualCallback } from '../utils.bot.js';

export const trackingIntervalScene = new Scene<BotCustomContext>(BotSceneNameList.TRACKING_INTERVAL_SCENE);

trackingIntervalScene.label(BotInlineKeyboardCommands.search_again.callbackData);

trackingIntervalScene.step(async (ctx) => {
  const intervalsKeyboard = createInlineKeyboardWithIntervals();
  const keyboardMessage = await ctx.reply('Выберите интервал проверки', {
    reply_markup: intervalsKeyboard,
  });

  ctx.session.keyboardMessageId = keyboardMessage.message_id;
  ctx.session.chatId = keyboardMessage.chat.id;

  ctx.scene.resume();
});

trackingIntervalScene.wait('chooseInterval').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
  const choice = ctx.callbackQuery.data;

  if (!isActualCallback(ctx)) {
    await deleteKeyboardMessage(ctx);
    return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
  }

  const router = await sceneRouter(ctx);
  await deleteKeyboardMessage(ctx);

  const interval = Number(choice);

  if (Number.isNaN(interval)) {
    await ctx.reply('Некорректный интервал. Попробуйте снова.');
    return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
  }

  const nextScene = router.next();

  if (nextScene === null) {
    return ctx.scene.exit();
  }
  return	ctx.scene.enter(nextScene);

});
