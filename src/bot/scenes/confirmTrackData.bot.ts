import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { createInlineKeyboardWithConfirm } from '../components/inlineKeyboardConfirm.bot.js';
import { createConfirmDataMessage, deleteKeyboardMessage, isActualCallback } from '../utils.bot.js';

export const confirmTrackDataScene = new Scene<BotCustomContext>(BotSceneNameList.CONFIRM_TRACK_DATA_SCENE);

confirmTrackDataScene.label(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);

confirmTrackDataScene.step(async (ctx) => {

	const confirmKeyboard = createInlineKeyboardWithConfirm();

	const message = createConfirmDataMessage(ctx);

	const keyboardMessage = await ctx.reply(message, {
		reply_markup: confirmKeyboard
	});

	ctx.session.keyboardMessageId = keyboardMessage.message_id;
	ctx.session.chatId = keyboardMessage.chat.id;

	ctx.scene.resume();
});

confirmTrackDataScene.wait('confirmData').on('callback_query:data', async (ctx) => {
	await ctx.answerCallbackQuery();
	const choice = ctx.callbackQuery.data;

	if (!isActualCallback(ctx)) {
		await deleteKeyboardMessage(ctx);
		return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	}

	ctx.session.tripRequestFilter.date_of_journey = choice;

	await deleteKeyboardMessage(ctx);

	const message = createConfirmDataMessage(ctx);

	await ctx.reply(message);

	return ctx.scene.exit();
});