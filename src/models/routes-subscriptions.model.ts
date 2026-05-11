export type RouteSubscriptionListItem = {
    id: number,
    created_at: string,
    user_id: number,
    pickup: number,
    destination: number,
    seats_limit: number,
    date_of_journey: number
}

export type RouteSubscriptionList = RouteSubscriptionListItem[]

export enum LocationTablePointColumnValue {
    PICKUP = 'pickup',
    DESTINATION = 'destination'
}

export enum RouteSubscriptionTableColumnsName {
  ID = 'id',
  CREATED_AT = 'created_at',
  USER_ID = 'user_id',
  PICKUP = 'pickup',
  DESTINATION = 'destination',
  SEATS_LIMIT = 'seats_limit',
  DATE_OF_JOURNEY = 'date_of_journey'
}

export type RouteSubscriptionTableRequestParams = {
  id?: number,
  created_at?: string,
  user_id?: number,
  pickup?: number,
  destination?: number,
  seats_limit?: number,
  date_of_journey?: string
}
