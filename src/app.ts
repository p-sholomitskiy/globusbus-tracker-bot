import { getLocationList } from './db/locations.repo.js';
import { getHtmlByFilter } from './parser/fetcher.parser.js';
import { performParse } from './parser/performer.parser.js';

const html = await getHtmlByFilter({
  pickup: '139',
  destination: '34',
  seats_limit: '1',
  date_of_journey: '11.04.2026',
});

const data = performParse(html!)
const locations = await  getLocationList();

console.log(locations);
