import { bot } from './bot/app.bot.js';
import { mainStage } from './bot/stage.bot.ts/mainStage.bot.js';
import { BotSceneNameList, type BotCustomContext, type SessionData } from './models/bot.models.js';
import { session } from 'grammy';

bot.use(session({
  initial: (): SessionData => ({
    currentSceneIndex: 0,
  })
}));

bot.use(mainStage.manager())
bot.use(mainStage)

bot.command('track', async (ctx) => {
  return ctx.scenes.enter(BotSceneNameList.START_LOCATION_SCENE)
})


bot.start();