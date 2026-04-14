import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { createInlineKeyboardWithDates } from '../components/inlineKeyboardDatePick.bot.js';
import { deleteKeyboardMessage, isActualCallback } from '../utils.bot.js';

export const datePickerScene = new Scene<BotCustomContext>(BotSceneNameList.DATE_PICKER_SCENE);

datePickerScene.label(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);

datePickerScene.step(async (ctx) => {
	const datesKeyboard = createInlineKeyboardWithDates();

	const keyboardMessage = await ctx.reply('Выберите дату', {
		reply_markup: datesKeyboard,
	});

	ctx.session.keyboardMessageId = keyboardMessage.message_id;
	ctx.session.chatId = keyboardMessage.chat.id;

	ctx.scene.resume();
});

datePickerScene.wait('chooseDate').on('callback_query:data', async (ctx) => {
	await ctx.answerCallbackQuery();
	const choice = ctx.callbackQuery.data;

	if (!isActualCallback(ctx)) {
		await deleteKeyboardMessage(ctx);
		return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	}

	ctx.session.tripRequestFilter.date_of_journey = choice;
	const router = await sceneRouter(ctx);
	deleteKeyboardMessage(ctx);

	const nextScene = router.next();

	if (nextScene === null) {
		return ctx.scene.exit();
	}

	return ctx.scene.enter(nextScene);

});