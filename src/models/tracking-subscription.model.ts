export type TrackingSubscriptionListItem = {
  id: number,
  created_at: string,
  pickup: number,
  destination: number,
  seats_limit: number,
  date_of_journey: string,
  time_list: string[] | null,
  status: string,
  chat_id: number
}

export type TrackingSubscriptionList = TrackingSubscriptionListItem[]

export type TrackingSubscriptionTableInsertItem = Omit<TrackingSubscriptionListItem, 'id' | 'created_at' | 'time_list'> & { time_list: string[] }

export type TrackingSubscriptionTableUpdateItem = Partial<TrackingSubscriptionTableInsertItem>

export enum TrackingSubscriptionTableColumnName {
  ID = 'id',
  CREATED_AT = 'created_at',
  PICKUP = 'pickup',
  DESTINATION = 'destination',
  SEATS_LIMIT = 'seats_limit',
  DATE_OF_JOURNEY = 'date_of_journey',
  TIME_LIST = 'time_list',
  STATUS = 'status',
  CHAT_ID = 'chat_id'
}

export enum TrackingSubscriptionStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELED = 'canceled',
  PENDING = 'pending'
}

export type TrackingSubscriptionTableRequestParams = {
  chat_id?: string,
  status?: string,
  orderBy?: string,
  ascending?: boolean
}
