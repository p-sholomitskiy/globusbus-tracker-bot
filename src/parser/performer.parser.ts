import * as cheerio from 'cheerio';
import type { Element } from 'domhandler';
import type { TripList } from '../models/trip.model.js';
import type { FetchResult } from '../models/parser.model.js';

export const performParse = (fetchResult: FetchResult) => {
	const $ = cheerio.load(fetchResult.html);
	const trips: TripList = [];
	if ($('.tickets-item').text().trim() === 'Нет доступных рейсов') {
		console.log('Нет доступных рейсов');
		return trips;
	}
	//TODO:check in future if is needed
	// const anchorUrl = new URL($('a.sort-link.sorting').eq(0).attr('href') || '');

	$('.tickets-item').each((_, block) => {
		const rawTripBlockItem = $(block);

		const getTrimmedText = (element: cheerio.Cheerio<Element>): string => {
			return element.text().trim();
		};

		const rawTimesBlock = rawTripBlockItem.find('.tickets-way__point-time');
		const rawAvailableTickets = rawTripBlockItem.find('.tickets-about__stay');
		const rawBusNumberBlock = rawTripBlockItem.find('.tickets-item__info-item').eq(0);
		const rawBusNumber = getTrimmedText(rawBusNumberBlock).split('\n')[1] || '';

		const busNumber = rawBusNumber.trim();
		const date = fetchResult.filter.date_of_journey;
		const startTime = getTrimmedText(rawTimesBlock.eq(0));
		const endTime = getTrimmedText(rawTimesBlock.eq(1));
		//TODO:check in future if is needed
		// const anchorUrl = new URL($('a.sort-link.sorting').eq(0).attr('href') || '');
		const startLocation = fetchResult.filter.pickup;
		const endLocation = fetchResult.filter.destination;
		const availableTickets = Number((getTrimmedText(rawAvailableTickets).match(/\d+/) || [0])[0]);

		const id = `${date.replaceAll('.','')}:${busNumber.toLowerCase()}`;

		trips.push({
			id,
			busNumber,
			date,
			startTime,
			endTime,
			startLocation,
			endLocation,
			availableTickets,
		});
	});

	return trips;
};
