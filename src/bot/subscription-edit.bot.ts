import { Composer } from 'grammy';
import { BotSceneNameList, type BotCustomContext } from '../models/bot.models.js';
import { getTrackingSubscriptionById } from '../db/tracking-subscription.repo.js';
import { getLocationListWithParams } from '../db/locations.repo.js';
import { isTrackingSubscriptionExpired } from '../scheduler/tracking.service.js';
import { deleteKeyboardMessage, initSessionParamsBeforeFirstScene } from './utils.bot.js';
import { stageOrder } from './stage/main-stage.bot.js';

export const subscriptionEditComposer = new Composer<BotCustomContext>();
subscriptionEditComposer.callbackQuery(/^subscription-edit:(\d+)$/, async (ctx) => {
  if (ctx.chat?.type !== 'private' || ctx.chat.id !== ctx.from.id) {
    await ctx.answerCallbackQuery({ text: 'Подписка недоступна.' });
    return;
  }
  const subscriptionId = Number(ctx.match[1]);
  if (!Number.isSafeInteger(subscriptionId)) {
    await ctx.answerCallbackQuery({ text: 'Некорректная подписка.' });
    return;
  }
  try {
    const subscription = await getTrackingSubscriptionById(subscriptionId, ctx.chat.id);
    if (!subscription || !['active', 'pending'].includes(subscription.status) || isTrackingSubscriptionExpired(subscription)) {
      await ctx.answerCallbackQuery({ text: 'Подписка недоступна. Откройте /subscriptions заново.' });
      return;
    }
    const locationList = await getLocationListWithParams({}) ?? [];
    await ctx.answerCallbackQuery();
    await deleteKeyboardMessage(ctx);
    await ctx.scenes.abort();
    initSessionParamsBeforeFirstScene(ctx);
    ctx.session.tripRequestFilter = {
      pickup: subscription.pickup, destination: subscription.destination,
      date_of_journey: subscription.date_of_journey, seats_limit: subscription.seats_limit,
    };
    ctx.session.selectedOptions.startLocation = locationList.find(location => location.value === subscription.pickup && location.point === 'pickup')?.name ?? String(subscription.pickup);
    ctx.session.selectedOptions.endLocation = locationList.find(location => location.value === subscription.destination && location.point === 'destination')?.name ?? String(subscription.destination);
    ctx.session.selectedOptions.date = subscription.date_of_journey;
    ctx.session.tripTimeList.selected = [...(subscription.time_list ?? [])];
    ctx.session.currentSceneIndex = stageOrder.indexOf(BotSceneNameList.TIME_PICKER_SCENE);
    await ctx.reply('Выберите новое время. Изменения сохранятся только после подтверждения.');
    await ctx.scenes.enter(BotSceneNameList.TIME_PICKER_SCENE);
  } catch (error) {
    console.error('Subscription edit failed:', error);
    await ctx.reply('Не удалось открыть редактирование. Попробуйте /subscriptions ещё раз.');
  }
});
