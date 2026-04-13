import { bot } from './bot/app.bot.js';
import { mainStage } from './bot/stage/mainStage.bot.js';
import { getLocationListWithParams } from './db/locations.repo.js';
import { BotSceneNameList, type SessionData } from './models/bot.models.js';
import { session } from 'grammy';
import { LocationTablePointColumnValue } from './models/locations.model.js';

bot.use(session({
  initial: (): SessionData => ({
    currentSceneIndex: 0,
    tripRequestFilter: {
      pickup: '',
      destination: '',
      date_of_journey: '',
      seats_limit: ''
    }
  })
}));

bot.use(mainStage.manager());
bot.use(mainStage);

bot.command('track', async (ctx) => {
  return ctx.scenes.enter(BotSceneNameList.START_LOCATION_SCENE);
});


bot.start();

const data = await getLocationListWithParams({ name: 'ка', point: LocationTablePointColumnValue.DESTINATION });
console.log(data);