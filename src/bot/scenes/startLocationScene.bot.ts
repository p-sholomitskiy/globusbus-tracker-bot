import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { getLocationListWithParams } from '../../db/locations.repo.js';
import { LocationTablePointColumnValue } from '../../models/locations.model.js';
import { createInlineKeyboardWithLocation } from '../components/inlineKeyboardLocationPick.bot.js';
import { deleteKeyboardMessage, isActualCallback } from '../utils.bot.js';

export const startLocationScene = new Scene<BotCustomContext>(BotSceneNameList.START_LOCATION_SCENE);

startLocationScene.label(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);

startLocationScene.step(async (ctx) => {
	await ctx.reply('Введите название отправного пункта');
});

startLocationScene.wait('startLocation').on('message:text', async (ctx) => {
	ctx.session.enteredStartLocation = ctx.message.text;

	const foundLocations = await getLocationListWithParams({
		name: ctx.session.enteredStartLocation,
		point: LocationTablePointColumnValue.PICKUP
	});

	if (foundLocations === null) {
		return;
	}

	if (foundLocations.length === 0) {
		await ctx.reply('Ничего не найдено, попробуйте снова');
	} else {
		const locationsKeyboard = createInlineKeyboardWithLocation(foundLocations);
		const keyboardMessage = await ctx.reply('Найдены следующие пункты. Выберете пожалуйста', {
			reply_markup: locationsKeyboard
		});
		ctx.session.keyboardMessageId = keyboardMessage.message_id;
		ctx.session.chatId = keyboardMessage.chat.id;

		ctx.scene.resume();
	}

});

startLocationScene.wait('chooseLocation').on('callback_query:data', async (ctx) => {
	await ctx.answerCallbackQuery();
	const choice = ctx.callbackQuery.data;

	if (!isActualCallback(ctx)) {
		deleteKeyboardMessage(ctx);
		return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	}

	if (choice === BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData) {
		deleteKeyboardMessage(ctx);
		return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	}

	ctx.session.tripRequestFilter.pickup = choice;
	const router = await sceneRouter(ctx);
	deleteKeyboardMessage(ctx);

	const nextScene = router.next();

	if (nextScene === null) {
		return ctx.scene.exit();
	}
    
	return ctx.scene.enter(nextScene);
});