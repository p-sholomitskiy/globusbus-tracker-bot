import { bot } from './bot/app.bot.js';
import { mainStage } from './bot/stage/mainStage.bot.js';
import { initSessionParamsBeforeFirstScene } from './bot/utils.bot.js';
import { BotSceneNameList, type SessionData } from './models/bot.models.js';
import { session } from 'grammy';

bot.use(session({
  initial: (): SessionData => ({
    currentSceneIndex: 0,
    tripRequestFilter: {
      pickup: null,
      destination: null,
      date_of_journey: '',
      seats_limit: null,
    },
    sessionMessageHistory: []
  })
}));

bot.use(mainStage.manager());
bot.use(mainStage);

bot.command('track', async (ctx) => {
  initSessionParamsBeforeFirstScene(ctx);
  console.log(ctx.session);
  await ctx.scenes.enter(BotSceneNameList.START_LOCATION_SCENE);

  return;
});


bot.start();
