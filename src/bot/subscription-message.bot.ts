import type { TrackingSubscriptionListItem } from '../models/tracking-subscription.model.js';
import type { LocationListItem } from '../models/locations.model.js';

export const formatSubscriptionMessage = (
  subscription: TrackingSubscriptionListItem,
  locationList: LocationListItem[],
): string => {
  const pickupName = locationList.find(location => location.value === subscription.pickup
    && location.point === 'pickup')?.name ?? `Пункт ${subscription.pickup}`;
  const destinationName = locationList.find(location => location.value === subscription.destination
    && location.point === 'destination')?.name ?? `Пункт ${subscription.destination}`;
  const statusLabelMap: Record<string, string> = {
    active: 'Отслеживается', pending: 'Приостановлена',
    canceled: 'Прекращена', expired: 'Завершена: дата поездки прошла',
  };
  const timeLabel = subscription.time_list?.length ? subscription.time_list.join(', ') : 'Не выбрано — настройте подписку через /track';
  return `🚌 ${pickupName} → ${destinationName}\nДата: ${subscription.date_of_journey}\nВремя: ${timeLabel}\nМест: ${subscription.seats_limit}\nСтатус: ${statusLabelMap[subscription.status] ?? subscription.status}`;
};
