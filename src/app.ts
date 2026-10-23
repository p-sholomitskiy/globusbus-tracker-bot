import { bot } from './bot/app.bot.js';
import { mainStage } from './bot/stage/main-stage.bot.js';
import { type SessionData } from './models/bot.models.js';
import { session } from 'grammy';
import { startTrackingScheduler, stopTrackingScheduler } from './scheduler/tracking.scheduler.js';
import { subscriptionListComposer } from './bot/subscription-list.bot.js';
import { menuComposer, BOT_COMMAND_LIST } from './bot/menu.bot.js';
import { subscriptionEditComposer } from './bot/subscription-edit.bot.js';
import { subscriptionComposer } from './bot/subscription.bot.js';

bot.use(subscriptionComposer);
bot.use(subscriptionListComposer);

bot.use(session({
  initial: (): SessionData => ({
    currentSceneIndex: 0,
    tripRequestFilter: {
      pickup: null,
      destination: null,
      date_of_journey: '',
      seats_limit: null,
    },
    sessionMessageHistory: [],
    locationMenuPagination: {
      locationList: [],
      currentPage: 0,
      totalPageCount: 1,
    },
    selectedOptions: {
      startLocation: '',
      endLocation: '',
      date: '',
      time: [],
    },
    tripTimeList: {
      fetched: [],
      selected: [],
    },
  }),
}));

bot.use(mainStage.manager());
bot.use(menuComposer);
bot.use(subscriptionEditComposer);
bot.use(mainStage);

let isShuttingDown = false;
let shutdownPromise: Promise<void> | undefined;

const stopApplication = (): Promise<void> => {
  if (shutdownPromise) return shutdownPromise;
  isShuttingDown = true;
  shutdownPromise = (async () => {
    console.log('Остановка: ожидаем завершения текущей проверки и обработки сообщений.');
    const stopResultList = await Promise.allSettled([
      stopTrackingScheduler(),
      bot.isRunning() ? bot.stop() : Promise.resolve(),
    ]);
    for (const stopResult of stopResultList) {
      if (stopResult.status === 'rejected') {
        console.error('Shutdown failed:', stopResult.reason);
        process.exitCode = 1;
      }
    }
  })();
  return shutdownPromise;
};

process.once('SIGINT', () => { void stopApplication(); });
process.once('SIGTERM', () => { void stopApplication(); });

try {
  await bot.start({
    onStart: async () => {
      if (isShuttingDown) return;
      try {
        await bot.api.setMyCommands(BOT_COMMAND_LIST);
      } catch (error) {
        console.error('Failed to register bot commands:', error);
      }
      if (!isShuttingDown) startTrackingScheduler();
    },
  });
} catch (error) {
  console.error('Bot stopped with an error:', error);
  process.exitCode = 1;
} finally {
  await stopApplication();
}
