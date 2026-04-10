import { getHtmlByFilter } from './parser/fetcher.parser';
import { performParse } from './parser/performer.parser';

const html = await getHtmlByFilter({
  pickup: '139',
  destination: '34',
  seats_limit: '1',
  date_of_journey: '11.04.2026',
});

const data = performParse(html!);

console.log(data);
