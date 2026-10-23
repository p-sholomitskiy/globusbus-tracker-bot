export const SUBSCRIPTION_CONFLICT_MESSAGE = 'На этот маршрут и дату уже есть действующая подписка. Откройте /subscriptions, чтобы управлять ей.';

export const isSubscriptionConflict = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
