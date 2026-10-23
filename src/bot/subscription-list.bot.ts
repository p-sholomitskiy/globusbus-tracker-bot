import { isSubscriptionConflict, SUBSCRIPTION_CONFLICT_MESSAGE } from '../db/tracking-subscription-error.util.js';
import { Composer, InlineKeyboard } from 'grammy';
import type { BotCustomContext } from '../models/bot.models.js';
import type { TrackingSubscriptionListItem } from '../models/tracking-subscription.model.js';
import { TrackingSubscriptionStatus } from '../models/tracking-subscription.model.js';
import { getTrackingSubscriptionList, getTrackingSubscriptionById, changeTrackingSubscriptionStatus } from '../db/tracking-subscription.repo.js';
import { getLocationListWithParams } from '../db/locations.repo.js';
import { isTrackingSubscriptionExpired } from '../scheduler/tracking.service.js';
import { MENU_BUTTON, createMainMenu } from './menu.bot.js';
import { formatSubscriptionMessage } from './subscription-message.bot.js';

export const subscriptionListComposer = new Composer<BotCustomContext>();

const createListSubscriptionKeyboard = (subscription: TrackingSubscriptionListItem): InlineKeyboard => {
  const keyboard = new InlineKeyboard();
  if (subscription.status === TrackingSubscriptionStatus.PENDING) {
    keyboard.text('Продолжить отслеживание', `subscription-list:resume:pending:${subscription.id}`).row();
  }
  if (subscription.status === TrackingSubscriptionStatus.ACTIVE || subscription.status === TrackingSubscriptionStatus.PENDING) {
    keyboard.text('Изменить время', `subscription-edit:${subscription.id}`).row();
    keyboard.text('Прекратить', `subscription-list:cancel:${subscription.status}:${subscription.id}`);
  }
  return keyboard;
};

const showSubscriptionList = async (ctx: BotCustomContext): Promise<void> => {
  if (ctx.chat?.type !== 'private') {
    await ctx.reply('Откройте список подписок в личном чате с ботом.');
    return;
  }
  try {
    const subscriptionList = await getTrackingSubscriptionList({ chat_id: String(ctx.chat.id) });
    if (!subscriptionList) {
      await ctx.reply('Не удалось загрузить подписки. Попробуйте позже.');
      return;
    }
    const currentSubscriptionList = subscriptionList.filter(subscription =>
      (subscription.status === TrackingSubscriptionStatus.ACTIVE
        || subscription.status === TrackingSubscriptionStatus.PENDING)
      && !isTrackingSubscriptionExpired(subscription),
    );
    const canceledSubscriptionList = subscriptionList.filter(subscription =>
      subscription.status === TrackingSubscriptionStatus.CANCELED && !isTrackingSubscriptionExpired(subscription),
    );
    if (!currentSubscriptionList.length) {
      await ctx.reply('У вас нет активных подписок. Начать отслеживание: /track', { reply_markup: createMainMenu() });
    } else {
      const locationList = await getLocationListWithParams({}) ?? [];
      await ctx.reply('Ваши подписки:', { reply_markup: createMainMenu() });
      for (const subscription of currentSubscriptionList) {
        await ctx.reply(formatSubscriptionMessage(subscription, locationList), {
          reply_markup: createListSubscriptionKeyboard(subscription),
        });
      }
    }
    if (canceledSubscriptionList.length) {
      await ctx.reply('Можно восстановить ранее отменённое отслеживание:', {
        reply_markup: new InlineKeyboard().text('Отменённые подписки', 'subscription-list:canceled'),
      });
    }
  } catch (error) {
    console.error('Subscription list failed:', error);
    await ctx.reply('Не удалось загрузить подписки. Попробуйте позже.');
  }
};

subscriptionListComposer.command('subscriptions', showSubscriptionList);
subscriptionListComposer.hears(MENU_BUTTON.subscriptions, showSubscriptionList);

subscriptionListComposer.callbackQuery('subscription-list:canceled', async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from.id) return;
  try {
    const subscriptionList = await getTrackingSubscriptionList({ chat_id: String(ctx.chat.id), status: TrackingSubscriptionStatus.CANCELED });
    if (!subscriptionList) {
      await ctx.reply('Не удалось загрузить подписки. Попробуйте позже.');
      return;
    }
    const canceledSubscriptionMap = new Map<string, TrackingSubscriptionListItem>();
    for (const subscription of subscriptionList) {
      if (isTrackingSubscriptionExpired(subscription)) continue;
      const subscriptionKey = JSON.stringify([
        subscription.pickup, subscription.destination, subscription.date_of_journey,
        subscription.seats_limit, [...new Set(subscription.time_list ?? [])].sort(),
      ]);
      const previousSubscription = canceledSubscriptionMap.get(subscriptionKey);
      if (!previousSubscription || subscription.id > previousSubscription.id) {
        canceledSubscriptionMap.set(subscriptionKey, subscription);
      }
    }
    const canceledSubscriptionList = [...canceledSubscriptionMap.values()];
    if (!canceledSubscriptionList.length) {
      await ctx.reply('Нет отменённых подписок, которые можно восстановить.');
      return;
    }
    const locationList = await getLocationListWithParams({}) ?? [];
    for (const subscription of canceledSubscriptionList) {
      await ctx.reply(formatSubscriptionMessage(subscription, locationList), {
        reply_markup: subscription.time_list?.length
          ? new InlineKeyboard().text('Восстановить отслеживание', `subscription-list:restore:canceled:${subscription.id}`)
          : { inline_keyboard: [] },
      });
    }
  } catch (error) {
    console.error('Canceled subscription list failed:', error);
    await ctx.reply('Не удалось загрузить подписки. Попробуйте позже.');
  }
});

subscriptionListComposer.callbackQuery(/^subscription-list:(resume|cancel|restore):(active|pending|canceled):(\d+)$/, async (ctx) => {
  if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from.id) {
    await ctx.answerCallbackQuery({ text: 'Подписка недоступна.' });
    return;
  }
  const subscriptionId = Number(ctx.match[3]);
  if (!Number.isSafeInteger(subscriptionId)) {
    await ctx.answerCallbackQuery({ text: 'Некорректная подписка.' });
    return;
  }
  try {
    const subscription = await getTrackingSubscriptionById(subscriptionId, ctx.chat.id);
    if (!subscription || subscription.status !== ctx.match[2]) {
      await ctx.answerCallbackQuery({ text: 'Список устарел. Откройте /subscriptions заново.' });
      return;
    }
    const isRestore = ctx.match[1] === 'restore';
    if ((isRestore && subscription.status !== TrackingSubscriptionStatus.CANCELED)
      || (!isRestore && subscription.status === TrackingSubscriptionStatus.CANCELED)) {
      await ctx.answerCallbackQuery({ text: 'Действие недоступно. Откройте /subscriptions заново.' });
      return;
    }
    if (isRestore) {
      if (isTrackingSubscriptionExpired(subscription)) {
        await ctx.answerCallbackQuery({ text: 'Дата поездки уже прошла.' });
        return;
      }
      if (!subscription.time_list?.length) {
        await ctx.answerCallbackQuery({ text: 'Сначала выберите время через /track.' });
        return;
      }
      const subscriptionList = await getTrackingSubscriptionList({ chat_id: String(ctx.chat.id) });
      if (!subscriptionList) {
        await ctx.answerCallbackQuery({ text: 'Не удалось проверить действующие подписки. Попробуйте позже.' });
        return;
      }
      const isDuplicate = subscriptionList.some(currentSubscription =>
        currentSubscription.id !== subscription.id
        && (currentSubscription.status === TrackingSubscriptionStatus.ACTIVE || currentSubscription.status === TrackingSubscriptionStatus.PENDING)
        && currentSubscription.pickup === subscription.pickup
        && currentSubscription.destination === subscription.destination
        && currentSubscription.date_of_journey === subscription.date_of_journey,
      );
      if (isDuplicate) {
        await ctx.answerCallbackQuery({ text: 'На этот маршрут и дату уже есть действующая подписка.' });
        return;
      }
    }
    const nextStatus = isTrackingSubscriptionExpired(subscription) ? TrackingSubscriptionStatus.EXPIRED
      : ctx.match[1] === 'cancel' ? TrackingSubscriptionStatus.CANCELED : TrackingSubscriptionStatus.ACTIVE;
    if (ctx.match[1] === 'resume' && subscription.status !== TrackingSubscriptionStatus.PENDING) {
      await ctx.answerCallbackQuery({ text: 'Подписка уже активна.' });
      return;
    }
    const updatedSubscription = await changeTrackingSubscriptionStatus(subscription.id, ctx.chat.id, subscription.status, nextStatus);
    if (!updatedSubscription) {
      await ctx.answerCallbackQuery({ text: 'Список устарел. Откройте /subscriptions заново.' });
      return;
    }
    await ctx.answerCallbackQuery({ text: nextStatus === 'active' ? (isRestore ? 'Отслеживание восстановлено.' : 'Отслеживание продолжено.') : 'Подписка завершена.' });
    const locationList = await getLocationListWithParams({}) ?? [];
    await ctx.editMessageText(formatSubscriptionMessage(updatedSubscription, locationList), {
      reply_markup: { inline_keyboard: [] },
    });
  } catch (error) {
    if (isSubscriptionConflict(error)) {
      await ctx.answerCallbackQuery({ text: SUBSCRIPTION_CONFLICT_MESSAGE, show_alert: true });
      return;
    }
    console.error('Subscription list action failed:', error);
    await ctx.reply('Не удалось обновить сообщение. Проверьте состояние через /subscriptions.');
  }
});
