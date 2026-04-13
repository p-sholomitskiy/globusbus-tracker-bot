import { Scene } from 'grammy-scenes';
import { BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { createInlineKeyboardWithIntervals } from '../components/inlineKeyboardIntervalPick.bot.js';

export const trackingIntervalScene = new Scene<BotCustomContext>(BotSceneNameList.TRACKING_INTERVAL_SCENE);

trackingIntervalScene.step(async (ctx) => {
    const intervalsKeyboard = createInlineKeyboardWithIntervals();
    const keyboardMessage = await ctx.reply('Выберите интервал проверки', {
        reply_markup: intervalsKeyboard,
    });

    ctx.session.keyboardMessageId = keyboardMessage.message_id;
    ctx.session.chatId = keyboardMessage.chat.id;

    ctx.scene.resume();
});

trackingIntervalScene.wait('chooseInterval').on('callback_query:data', async (ctx) => {
    await ctx.answerCallbackQuery();
    const choice = ctx.callbackQuery.data;
    console.log(choice);

    ctx.session.tripRequestFilter.date_of_journey = choice;

    const router = await sceneRouter(ctx);
    ctx.api.deleteMessage(ctx.session.chatId!, ctx.session.keyboardMessageId!);
    const nextScene = router.next();
    if (nextScene === null) {
        ctx.scene.exit();
    }
    else {
        ctx.scene.enter(nextScene);
    }
});