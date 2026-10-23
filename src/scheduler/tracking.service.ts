import type { TrackingPassStatistics } from '../models/scheduler.model.js';
import { searchBackoff } from '../parser/search-backoff.util.js';
import { isBefore, parse, startOfDay } from 'date-fns';
import { bot } from '../bot/app.bot.js';
import { SUPERBUS_SEARCH_URL } from '../constants.js';
import { getLocationListWithParams } from '../db/locations.repo.js';
import { TrackingSubscriptionStatus, type TrackingSubscriptionListItem } from '../models/tracking-subscription.model.js';
import type { TripListItem } from '../models/trip.model.js';
import { getHtmlByFilter } from '../parser/fetcher.parser.js';
import { performParse } from '../parser/performer.parser.js';
import { getTrackingSubscriptionById, changeTrackingSubscriptionStatus } from '../db/tracking-subscription.repo.js';
import { createSubscriptionKeyboard } from '../bot/components/inline-keyboard-subscription.bot.js';

// Retain successfully delivered notifications while retrying a failed database update.
const deliveredSubscriptionIdSet = new Set<number>();

export const checkTrackingSubscription = async (
  subscription: TrackingSubscriptionListItem,
  searchTripListMap = new Map<string, TripListItem[] | null>(),
  statistics?: TrackingPassStatistics,
): Promise<void> => {

  if (deliveredSubscriptionIdSet.has(subscription.id)) {
    await changeTrackingSubscriptionStatus(subscription.id, subscription.chat_id,
      TrackingSubscriptionStatus.ACTIVE, TrackingSubscriptionStatus.PENDING);
    deliveredSubscriptionIdSet.delete(subscription.id);
    return;
  }

  if (!subscription.time_list?.length) return;

  const { pickup, destination, date_of_journey, seats_limit } = subscription;

  const searchKey = JSON.stringify([pickup, destination, date_of_journey, seats_limit]);
  if (!searchTripListMap.has(searchKey)) {
    if (searchBackoff.getRemainingDelayMs() > 0) {
      searchTripListMap.set(searchKey, null);
      if (statistics) statistics.skippedSearchCount++;
      return;
    }
    if (statistics) statistics.searchCount++;
    const fetchedHtml = await getHtmlByFilter({ pickup, destination, date_of_journey, seats_limit });
    if (!fetchedHtml && statistics) statistics.errorCount++;
    searchTripListMap.set(searchKey, fetchedHtml ? performParse(fetchedHtml) : null);
  }
  const tripList = searchTripListMap.get(searchKey);
  if (!tripList) return;

  const availableTripList = tripList.filter((trip: TripListItem) =>
    subscription.time_list?.includes(trip.startTime)
    && trip.availableTickets >= subscription.seats_limit,
  );

  if (!availableTripList.length) {

    return;
  }

  const currentSubscription = await getTrackingSubscriptionById(subscription.id, subscription.chat_id);
  if (!currentSubscription || currentSubscription.status !== TrackingSubscriptionStatus.ACTIVE
    || currentSubscription.pickup !== pickup || currentSubscription.destination !== destination
    || currentSubscription.date_of_journey !== date_of_journey
    || currentSubscription.seats_limit !== seats_limit
    || JSON.stringify(currentSubscription.time_list) !== JSON.stringify(subscription.time_list)) return;

  const locationList = await getLocationListWithParams({}) ?? [];
  const pickupName = locationList.find(location => location.value === pickup && location.point === 'pickup')?.name ?? `Пункт ${pickup}`;
  const destinationName = locationList.find(location => location.value === destination && location.point === 'destination')?.name ?? `Пункт ${destination}`;
  const searchParams = new URLSearchParams({
    pickup: String(pickup), destination: String(destination),
    seats_limit: String(seats_limit), date_of_journey,
  });
  const searchUrl = `${SUPERBUS_SEARCH_URL}?${searchParams}`;
  const tripDescriptionList = availableTripList.map(trip => `🕐 ${trip.startTime} — свободных мест: ${trip.availableTickets}`);

  await bot.api.sendMessage(
    subscription.chat_id,
    `🚍 Появились свободные места!\n\n${pickupName} → ${destinationName}\n📅 ${date_of_journey}\n${tripDescriptionList.join('\n')}\n\nМеста могут закончиться до покупки. Бот не бронирует билеты.\n\nОтслеживание приостановлено. Продолжить?`,
    { reply_markup: createSubscriptionKeyboard(subscription.id, searchUrl) },
  );
  if (statistics) statistics.notificationCount++;
  deliveredSubscriptionIdSet.add(subscription.id);
  await changeTrackingSubscriptionStatus(subscription.id, subscription.chat_id,
    TrackingSubscriptionStatus.ACTIVE, TrackingSubscriptionStatus.PENDING);
  deliveredSubscriptionIdSet.delete(subscription.id);
};

export const isTrackingSubscriptionExpired = (subscription: TrackingSubscriptionListItem): boolean => {
  const trackingDate = parse(subscription.date_of_journey, 'dd.MM.yyyy', new Date());

  return isBefore(trackingDate, startOfDay(new Date()));
};
