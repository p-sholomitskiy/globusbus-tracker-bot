import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotInlineKeyboardConfirmItems, BotKeyboardValues, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { createInlineKeyboardWithConfirm } from '../components/inlineKeyboardConfirm.bot.js';
import { botTextMessage, createConfirmDataMessage, deleteKeyboardMessage, isActualCallback, sessionMessageHistory } from '../utils.bot.js';
import type { RouteSubscriptionListItem, RouteSubscriptionTableRequestParams } from '../../models/routes-subscriptions.model.js';
import { addRouteSubscriptions } from '../../db/routes-subscriptions.model.js';

export const confirmTrackDataScene = new Scene<BotCustomContext>(
  BotSceneNameList.CONFIRM_TRACK_DATA_SCENE,
);

confirmTrackDataScene.label(
  BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData,
);

confirmTrackDataScene.step(async (ctx) => {
  const confirmKeyboard = createInlineKeyboardWithConfirm();

  const message = createConfirmDataMessage(ctx);

  const keyboardMessage = await botTextMessage(ctx, message, confirmKeyboard);

  ctx.session.keyboardMessageId = keyboardMessage.message_id;
  ctx.session.chatId = keyboardMessage.chat.id;

  ctx.scene.resume();
});

confirmTrackDataScene.wait('confirmData').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
  const choice = ctx.callbackQuery.data;

  if (!isActualCallback(ctx)) {
    await deleteKeyboardMessage(ctx);
    return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
  }

  if (choice === BotKeyboardValues.RESTART) {
    sessionMessageHistory(ctx).deleteMessages();
    ctx.scene.enter(BotSceneNameList.START_LOCATION_SCENE);

    return;
  }

  if (choice === BotKeyboardValues.CONFIRM) {
    const payload: RouteSubscriptionTableRequestParams = {
      user_id: ctx.from.id,
      ...ctx.session.tripRequestFilter,
    };

    await addRouteSubscriptions(payload);
  }

  ctx.session.tripRequestFilter.date_of_journey = choice;

  await deleteKeyboardMessage(ctx);

  const message = createConfirmDataMessage(ctx);

  await ctx.reply(message);

  return ctx.scene.exit();
});

