import { InlineKeyboard } from 'grammy';

export const createSubscriptionKeyboard = (subscriptionId: number, searchUrl?: string): InlineKeyboard => new InlineKeyboard()
  .url('Открыть поиск на Globusbus', searchUrl ?? 'https://globusbus.by/tickets/search')
  .row()
  .text('Продолжить отслеживание', `subscription:resume:${subscriptionId}`)
  .row()
  .text('Прекратить', `subscription:cancel:${subscriptionId}`);
