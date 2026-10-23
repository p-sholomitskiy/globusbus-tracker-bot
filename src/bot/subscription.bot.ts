import { isSubscriptionConflict, SUBSCRIPTION_CONFLICT_MESSAGE } from '../db/tracking-subscription-error.util.js';
import { Composer } from 'grammy';
import { createSubscriptionKeyboard } from './components/inline-keyboard-subscription.bot.js';
import type { BotCustomContext } from '../models/bot.models.js';
import { getTrackingSubscriptionById, changeTrackingSubscriptionStatus } from '../db/tracking-subscription.repo.js';
import { TrackingSubscriptionStatus } from '../models/tracking-subscription.model.js';
import { isTrackingSubscriptionExpired } from '../scheduler/tracking.service.js';

export const subscriptionComposer = new Composer<BotCustomContext>();

subscriptionComposer.callbackQuery(/^subscription:(resume|cancel):(\d+)$/, async (ctx) => {
  // Subscriptions belong to a private chat; group participants cannot control them.
  if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from.id) {
    await ctx.answerCallbackQuery({ text: 'Подписка недоступна.' });
    return;
  }

  const subscriptionId = Number(ctx.match[2]);
  if (!Number.isSafeInteger(subscriptionId)) {
    await ctx.answerCallbackQuery({ text: 'Некорректная подписка.' });
    return;
  }

  try {
    const subscription = await getTrackingSubscriptionById(subscriptionId, ctx.chat.id);
    if (!subscription || subscription.status !== TrackingSubscriptionStatus.PENDING) {
      await ctx.answerCallbackQuery({ text: 'Эта подписка уже обработана или недоступна.' });
      return;
    }

    const nextStatus = isTrackingSubscriptionExpired(subscription)
      ? TrackingSubscriptionStatus.EXPIRED
      : ctx.match[1] === 'resume'
        ? TrackingSubscriptionStatus.ACTIVE
        : TrackingSubscriptionStatus.CANCELED;

    // Remove the old controls before resuming so they cannot be used in a later cycle.
    await ctx.editMessageReplyMarkup({ reply_markup: { inline_keyboard: [] } });
    let updatedSubscription;
    try {
      updatedSubscription = await changeTrackingSubscriptionStatus(
        subscription.id, subscription.chat_id, TrackingSubscriptionStatus.PENDING, nextStatus,
      );
    } catch (error) {
      await ctx.editMessageReplyMarkup({ reply_markup: createSubscriptionKeyboard(subscription.id) });
      throw error;
    }

    const statusText = !updatedSubscription
      ? 'Эта подписка уже обработана.'
      : nextStatus === TrackingSubscriptionStatus.EXPIRED
        ? 'Дата поездки прошла. Подписка завершена.'
        : nextStatus === TrackingSubscriptionStatus.ACTIVE
          ? 'Отслеживание продолжено.'
          : 'Отслеживание прекращено.';
    if (updatedSubscription) {
      const notificationMessage = ctx.callbackQuery.message;
      const notificationText = notificationMessage && 'text' in notificationMessage
        ? notificationMessage.text ?? ''
        : '';
      const tripText = notificationText.split('\n\nОтслеживание приостановлено. Продолжить?')[0];
      const confirmationText = nextStatus === TrackingSubscriptionStatus.ACTIVE
        ? '✅ Отслеживание продолжено. Сообщим, если места будут доступны при следующей проверке.'
        : nextStatus === TrackingSubscriptionStatus.CANCELED
          ? '⏹ Отслеживание прекращено.'
          : '⌛ Дата поездки прошла. Подписка завершена.';
      try {
        await ctx.editMessageText(`${tripText}\n\n${confirmationText}`, {
          reply_markup: { inline_keyboard: [] },
        });
      } catch (error) {
        // The status is already saved; a Telegram edit failure must not undo it.
        console.error('Subscription message edit failed:', error);
      }
    }
    await ctx.answerCallbackQuery({ text: statusText });
  } catch (error) {
    if (isSubscriptionConflict(error)) {
      await ctx.answerCallbackQuery({ text: SUBSCRIPTION_CONFLICT_MESSAGE, show_alert: true });
      return;
    }
    console.error('Subscription callback failed:', error);
    await ctx.answerCallbackQuery({ text: 'Не удалось изменить подписку. Попробуйте ещё раз.' });
  }
});
