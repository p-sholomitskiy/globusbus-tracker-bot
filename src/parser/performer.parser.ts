import * as cheerio from 'cheerio';
import { TripItem } from '../models/trip.model';

export const performParse = (html: string) => {
  const $ = cheerio.load(html);
  const trips: TripItem[] = [];
  $('.tickets-item').each((_, block) => {
    trips.push({
      id: '',
      busNumber: '',
      date: $(block).find('.tickets-way__point-date.start-date').text(),
      description: $(block).find('.tickets-item__header-l').text(),
      startTime: $(block).find('.tickets-way__point-time').first().text(),
      endTime: $(block).find('.tickets-way__point-time').last().text(),
      startLocation: $(block).find('.start-city').text(),
      endLocation: $(block).find('.end-city').text(),
      availableTickets: parseInt($(block).find('.tickets-about__stay').text()),
    });
  });

  return trips;
};
