import type { TrackingSubscriptionListItem, TrackingSubscriptionTableInsertItem } from '../models/tracking-subscription.model.js';

export const findMatchingSubscription = (
  subscriptionList: TrackingSubscriptionListItem[],
  request: TrackingSubscriptionTableInsertItem,
): TrackingSubscriptionListItem | undefined => {
  const routeSubscriptionList = subscriptionList.filter(subscription =>
    subscription.chat_id === request.chat_id && subscription.pickup === request.pickup
    && subscription.destination === request.destination && subscription.date_of_journey === request.date_of_journey,
  ).sort((firstSubscription, secondSubscription) => secondSubscription.id - firstSubscription.id);
  const currentSubscription = routeSubscriptionList.find(subscription => subscription.status === 'active' || subscription.status === 'pending');
  if (currentSubscription) return currentSubscription;
  const requestedTimeKey = JSON.stringify([...new Set(request.time_list)].sort());
  return routeSubscriptionList.find(subscription => subscription.status === 'canceled'
    && subscription.seats_limit === request.seats_limit
    && JSON.stringify([...new Set(subscription.time_list ?? [])].sort()) === requestedTimeKey);
};
