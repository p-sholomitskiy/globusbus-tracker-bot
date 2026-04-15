import type { TripRequestFilter } from './trip.model.js';

export type FetchResult = {
    html: string,
    filter: TripRequestFilter,
}