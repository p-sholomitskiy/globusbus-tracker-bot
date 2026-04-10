import { SUPERBUS_SEARCH_URL } from '../constants';
import { TripRequestFilter } from '../models/trip.model';

export const getHtmlByFilter = async (filterPayload: TripRequestFilter) => {
  try {
    const filterParams = new URLSearchParams(filterPayload);
    const response = await fetch(`${SUPERBUS_SEARCH_URL}?${filterParams}`);
    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }
    const data = await response.text();

    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
};
