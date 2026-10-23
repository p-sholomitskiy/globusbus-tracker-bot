import { isSubscriptionConflict, SUBSCRIPTION_CONFLICT_MESSAGE } from '../../db/tracking-subscription-error.util.js';
import { formatSubscriptionMessage } from '../subscription-message.bot.js';
import { getLocationListWithParams } from '../../db/locations.repo.js';
import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { createInlineKeyboardWithConfirm } from '../components/inline-keyboard-confirm.bot.js';
import { createConfirmDataMessage, deleteKeyboardMessage, isActualCallback } from '../utils.bot.js';
import { findMatchingSubscription } from '../subscription-match.bot.js';
import { createTrackingSubscription, getTrackingSubscriptionList, updateTrackingSubscription } from '../../db/tracking-subscription.repo.js';
import { TrackingSubscriptionStatus } from '../../models/tracking-subscription.model.js';
import { createInlineKeyboardWithUpdateSubscription } from '../components/inline-keyboard-update-subscription.bot.js';

export const confirmTrackDataScene = new Scene<BotCustomContext>(
  BotSceneNameList.CONFIRM_TRACK_DATA_SCENE,
);

confirmTrackDataScene.label(
  BotInlineKeyboardCommands.search_again.callbackData,
);

confirmTrackDataScene.step(async (ctx) => {
  const confirmKeyboard = createInlineKeyboardWithConfirm();

  const message = createConfirmDataMessage(ctx);

  const keyboardMessage = await ctx.reply(message, {
    reply_markup: confirmKeyboard,
  });

  ctx.session.keyboardMessageId = keyboardMessage.message_id;
  ctx.session.chatId = keyboardMessage.chat.id;

  ctx.scene.resume();
});

confirmTrackDataScene.wait('confirmData').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
  try {
    const selectedButtonData = ctx.callbackQuery.data;

    if (!isActualCallback(ctx)) {
      await deleteKeyboardMessage(ctx);
      return ctx.scene.goto(
        BotInlineKeyboardCommands.search_again.callbackData,
      );
    }

    if (selectedButtonData === BotInlineKeyboardCommands.search_again.callbackData) {
      await deleteKeyboardMessage(ctx);
      return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
    }

    if (selectedButtonData === BotInlineKeyboardCommands.restart.callbackData) {
      await deleteKeyboardMessage(ctx);
      ctx.session.currentSceneIndex = 0;
      return ctx.scene.enter(BotSceneNameList.START_LOCATION_SCENE);
    }

    if (selectedButtonData === BotInlineKeyboardCommands.cancel.callbackData) {
      await ctx.editMessageText('Изменение подписки отменено.');
      return ctx.scene.exit();
    }

    if (selectedButtonData !== BotInlineKeyboardCommands.confirm.callbackData
      && selectedButtonData !== 'update_subscription') {
      return;
    }

    const { pickup, destination, date_of_journey, seats_limit } = ctx.session.tripRequestFilter;
    const { tripTimeList } = ctx.session;

    if (
      pickup == null ||
      destination == null ||
      date_of_journey == null ||
      seats_limit == null
    ) {
      throw new Error('Trip filter is incomplete');
    }

    if (!tripTimeList.selected.length) {
      await ctx.reply('Выберите хотя бы одно время через /track.');
      return;
    }
    const subscriptionRequest = {
      chat_id: ctx.chat!.id, pickup, destination, date_of_journey, seats_limit,
      time_list: tripTimeList.selected, status: TrackingSubscriptionStatus.ACTIVE,
    };
    const subscriptionList = await getTrackingSubscriptionList({ chat_id: String(ctx.chat!.id) });
    if (!subscriptionList) {
      await ctx.reply('Не удалось проверить подписки. Попробуйте подтвердить ещё раз.');
      return;
    }
    const existingSubscription = findMatchingSubscription(subscriptionList, subscriptionRequest);

    if (selectedButtonData === 'update_subscription') {
      if (!existingSubscription) {
        await ctx.editMessageText('Подписка изменилась. Запустите /track заново.');
        return ctx.scene.exit();
      }
      const updatedRecord = await updateTrackingSubscription(
        existingSubscription.id,
        {
          status: TrackingSubscriptionStatus.ACTIVE,
          time_list: tripTimeList.selected,
          seats_limit,
        },
      );

      if (!updatedRecord) {
        await ctx.reply('Не удалось обновить подписку. Попробуйте подтвердить ещё раз.');
        return;
      }

      await ctx.editMessageText(`✅ Подписка обновлена\n\n${formatSubscriptionMessage(updatedRecord, await getLocationListWithParams({}) ?? [])}`);

      return ctx.scene.exit();
    }

    if (existingSubscription) {
      const confirmationText = existingSubscription.status === TrackingSubscriptionStatus.CANCELED
        ? 'Такая подписка уже была отменена. Восстановить отслеживание?'
        : existingSubscription.status === TrackingSubscriptionStatus.PENDING
          ? 'Подписка на этот маршрут и дату приостановлена. Применить выбранное время и продолжить отслеживание?'
          : 'Подписка на этот маршрут и дату уже активна. Обновить выбранное время?';
      await ctx.editMessageText(confirmationText, {
        reply_markup: createInlineKeyboardWithUpdateSubscription(),
      });

      return;
    }

    const addedRecord = await createTrackingSubscription({
      pickup,
      destination,
      date_of_journey,
      seats_limit,
      status: TrackingSubscriptionStatus.ACTIVE,
      time_list: tripTimeList.selected,
      chat_id: ctx.chat!.id,
    });

    if (!addedRecord) {
      await ctx.reply('Не удалось создать подписку. Попробуйте подтвердить ещё раз.');
      return;
    }

    await ctx.editMessageText(`✅ Отслеживание включено\n\n${formatSubscriptionMessage(addedRecord, await getLocationListWithParams({}) ?? [])}`);

    return ctx.scene.exit();
  } catch (error) {
    if (isSubscriptionConflict(error)) {
      await ctx.editMessageText(SUBSCRIPTION_CONFLICT_MESSAGE);
      return ctx.scene.exit();
    }
    console.error('Subscription confirmation failed:', error);
    await ctx.reply('Не удалось сохранить подписку. Попробуйте ещё раз.');
  }
});
