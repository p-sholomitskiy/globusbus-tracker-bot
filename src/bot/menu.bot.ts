import { Composer, Keyboard } from 'grammy';
import type { BotCustomContext } from '../models/bot.models.js';
import { BotSceneNameList } from '../models/bot.models.js';
import { deleteKeyboardMessage, initSessionParamsBeforeFirstScene } from './utils.bot.js';

export const MENU_BUTTON = {
  track: '🚌 Отслеживать рейс',
  subscriptions: '📋 Мои подписки',
  help: 'ℹ️ Как это работает',
} as const;

export const createMainMenu = (): Keyboard => new Keyboard()
  .text(MENU_BUTTON.track)
  .row()
  .text(MENU_BUTTON.subscriptions)
  .text(MENU_BUTTON.help)
  .resized()
  .persistent();

export const BOT_COMMAND_LIST = [
  { command: 'start', description: 'Главное меню' },
  { command: 'track', description: 'Отслеживать рейс' },
  { command: 'subscriptions', description: 'Мои подписки' },
  { command: 'help', description: 'Как работает бот' },
];

export const menuComposer = new Composer<BotCustomContext>();

menuComposer.command('start', async (ctx) => {
  if (ctx.chat.type !== 'private') {
    await ctx.reply('Откройте личный чат с ботом, чтобы настроить отслеживание.');
    return;
  }
  await deleteKeyboardMessage(ctx);
  await ctx.scenes.abort();
  initSessionParamsBeforeFirstScene(ctx);
  await ctx.reply('Я помогу узнать, когда появятся свободные места на рейс Globusbus.\n\n'
    + 'Выберите маршрут, дату и время. Когда найдутся места, я отправлю одно уведомление и приостановлю отслеживание. '
    + 'После этого вы сможете продолжить или прекратить его.\n\n'
    + 'Я не бронирую билеты: наличие мест может измениться до покупки.\n\n'
    + 'Выберите действие в меню ниже.', { reply_markup: createMainMenu() });
});

const showHelp = async (ctx: BotCustomContext): Promise<void> => {
  await ctx.reply('ℹ️ Как это работает\n\n'
    + '🚌 Создание подписки\n'
    + 'Нажмите «Отслеживать рейс» или /track. Выберите отправление, назначение, дату и одно или несколько времён отправления, затем подтвердите подписку.\n\n'
    + '🔔 Уведомления\n'
    + 'Бот периодически проверяет сайт Globusbus. Когда найдутся места, придёт одно уведомление: маршрут, дата, время, количество свободных мест и ссылка на поиск билетов. '
    + 'После этого подписка приостанавливается. Нажмите «Продолжить отслеживание» или «Прекратить». Если продолжить и места ещё есть, ближайшая проверка снова отправит уведомление.\n\n'
    + '📋 Мои подписки\n'
    + 'Кнопка «Мои подписки» или /subscriptions показывает активные и приостановленные подписки. Здесь можно изменить время или прекратить отслеживание. '
    + 'Новое время сохраняется только после подтверждения; приостановленная подписка после сохранения снова становится активной.\n\n'
    + '↩️ Восстановление\n'
    + 'В разделе «Отменённые подписки» можно восстановить подписку с сохранёнными параметрами, если дата ещё не прошла и время выбрано. '
    + 'Одинаковые отменённые подписки показываются одной карточкой. Вторую действующую подписку на тот же маршрут и дату создать нельзя — бот предложит обновить существующую.\n\n'
    + '🌐 Если сайт недоступен\n'
    + 'При сетевых сбоях проверки замедляются, затем возобновляются автоматически. Во время выбора рейса можно нажать «Повторить поиск» — маршрут и дата сохранятся.\n\n'
    + 'Бот не бронирует и не покупает билеты. Проверка периодическая: места могут закончиться до покупки. После даты поездки отслеживание завершается. '
    + 'Для получения уведомлений не нужно держать Telegram открытым.\n\n'
    + 'Новый поиск сбрасывает только незавершённый выбор; сохранённые подписки остаются. Справка и просмотр подписок не прерывают выбор рейса.\n\n'
    + '/start — главное меню\n/track — новый поиск\n/subscriptions — мои подписки\n/help — помощь',
  { reply_markup: createMainMenu() });
};

const startTracking = async (ctx: BotCustomContext): Promise<void> => {
  if (ctx.chat?.type !== 'private') {
    await ctx.reply('Настройте отслеживание в личном чате с ботом.');
    return;
  }
  await deleteKeyboardMessage(ctx);
  await ctx.scenes.abort();
  initSessionParamsBeforeFirstScene(ctx);
  await ctx.reply('Выберите параметры нового отслеживания.', { reply_markup: createMainMenu() });
  await ctx.scenes.enter(BotSceneNameList.START_LOCATION_SCENE);
};

menuComposer.command('help', showHelp);
menuComposer.hears(MENU_BUTTON.help, showHelp);
menuComposer.command('track', startTracking);
menuComposer.hears(MENU_BUTTON.track, startTracking);
