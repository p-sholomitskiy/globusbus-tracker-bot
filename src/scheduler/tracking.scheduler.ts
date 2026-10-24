import { getTrackingSubscriptionList, changeTrackingSubscriptionStatus } from '../db/tracking-subscription.repo.js';
import { TRACKING_SCHEDULER_DELAY, type TrackingPassStatistics } from '../models/scheduler.model.js';
import { TrackingSubscriptionStatus } from '../models/tracking-subscription.model.js';
import { checkTrackingSubscription, isTrackingSubscriptionExpired } from './tracking.service.js';

import { searchBackoff } from '../parser/search-backoff.util.js';
import type { TripListItem } from '../models/trip.model.js';

let isSchedulerStarted = false;
let schedulerTimer: ReturnType<typeof setTimeout> | undefined;
let currentPass: Promise<void> | undefined;

export const stopTrackingScheduler = async (): Promise<void> => {
  isSchedulerStarted = false;
  clearTimeout(schedulerTimer);
  schedulerTimer = undefined;
  await currentPass;
};

export const startTrackingScheduler = (): void => {
  if (isSchedulerStarted) return;
  isSchedulerStarted = true;

  const checkSubscriptionList = async (): Promise<void> => {
    const startedAt = performance.now();
    const statistics: TrackingPassStatistics = { searchCount: 0, notificationCount: 0, errorCount: 0, skippedSearchCount: 0 };
    let subscriptionCount = 0;
    try {
      const trackingSubscriptionList = await getTrackingSubscriptionList({});
      if (!trackingSubscriptionList) statistics.errorCount++;
      subscriptionCount = (trackingSubscriptionList ?? []).filter(subscription =>
        subscription.status === TrackingSubscriptionStatus.ACTIVE
          && !isTrackingSubscriptionExpired(subscription) && !!subscription.time_list?.length,
      ).length;
      const searchTripListMap = new Map<string, TripListItem[] | null>();
      for (const subscription of trackingSubscriptionList ?? []) {
        if (!isSchedulerStarted) break;
        if (subscription.status !== TrackingSubscriptionStatus.ACTIVE
          && subscription.status !== TrackingSubscriptionStatus.PENDING) continue;
        try {
          if (isTrackingSubscriptionExpired(subscription)) {
            await changeTrackingSubscriptionStatus(subscription.id, subscription.chat_id,
              subscription.status, TrackingSubscriptionStatus.EXPIRED);
          } else if (subscription.status === TrackingSubscriptionStatus.ACTIVE) {
            await checkTrackingSubscription(subscription, searchTripListMap, statistics);
          }
        } catch (error) {
          statistics.errorCount++;
          console.error(`Tracking subscription ${subscription.id} failed:`, error);
        }
      }
    } catch (error) {
      statistics.errorCount++;
      console.error('Tracking scheduler failed:', error);
    } finally {
      const nextDelayMs = Math.max(TRACKING_SCHEDULER_DELAY, searchBackoff.getRemainingDelayMs());
      const nextCheckText = isSchedulerStarted ? `через ${(nextDelayMs / 1000).toFixed(1)} с` : 'остановлена';
      if (subscriptionCount > 0) console.log(`Проверка: подписок ${subscriptionCount}, уникальных поисков ${statistics.searchCount}, уведомлений ${statistics.notificationCount}, ошибок ${statistics.errorCount}, пропущено поисков из-за паузы ${statistics.skippedSearchCount}, длительность ${((performance.now() - startedAt) / 1000).toFixed(1)} с, следующая проверка ${nextCheckText}`);
      scheduleNextPass();
    }
  };

  const scheduleNextPass = (): void => {
    if (!isSchedulerStarted) return;
    schedulerTimer = setTimeout(() => {
      currentPass = checkSubscriptionList();
    }, Math.max(TRACKING_SCHEDULER_DELAY, searchBackoff.getRemainingDelayMs()));
  };
  scheduleNextPass();
};
