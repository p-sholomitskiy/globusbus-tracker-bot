import * as cheerio from 'cheerio';
import { TripList, TripListItem } from '../models/trip.model';

export const performParse = (html: string) => {
  const $ = cheerio.load(html);
  const trips: TripList = [];
  if ($('.tickets-item').text().trim() === 'Нет доступных рейсов') {
    console.log('Нет доступных рейсов')
    return trips;
  }

  const anchorUrl = new URL($('a.sort-link.sorting').eq(0).attr('href') || '')

  $('.tickets-item').each((_, block) => {
    const rawTripBlockItem = $(block);

    const rawTimesBlock = rawTripBlockItem.find('.tickets-way__point-time');
    const rawAvailableTickets = rawTripBlockItem.find('.tickets-about__stay');
    const rawBusNumber = rawTripBlockItem.find('.tickets-item__info-item').eq(0);

    const getTrimmedText = (element: cheerio.Cheerio<any>): string => {
      return element.text().trim();
    }

    const busNumber = getTrimmedText(rawBusNumber).split('\n')[1].trim();
    const date = getTrimmedText(rawTripBlockItem.find('.tickets-way__point-date.start-date'));
    const startTime = getTrimmedText(rawTimesBlock.eq(0));
    const endTime = getTrimmedText(rawTimesBlock.eq(1));
    const startLocation = anchorUrl.searchParams.get('pickup') || '0';
    const endLocation = anchorUrl.searchParams.get('destination') || '0';
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
