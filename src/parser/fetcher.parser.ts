import { SUPERBUS_SEARCH_URL } from '../constants.js';
import type { TripRequestFilter } from '../models/trip.model.js';

export const getHtmlByFilter = async (filterPayload: TripRequestFilter) => {
	try {
		const filterParams = new URLSearchParams(filterPayload);
		const response = await fetch(`${SUPERBUS_SEARCH_URL}?${filterParams}`);
		if (!response.ok) {
			throw new Error(`${response.status} ${response.statusText}`);
		}
		const html = await response.text();

		return { html, filter: filterPayload };
	} catch (error) {
		console.error('Fetch error:', error);
		return null;
	}
};
