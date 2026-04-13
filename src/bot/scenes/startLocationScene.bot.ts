import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { getLocationListWithParams } from '../../db/locations.repo.js';
import { LocationTablePointColumnValue } from '../../models/locations.model.js';
import { createInlineKeyboardWithLocation } from '../components/inlineKeyboardLocationPick.bot.js';

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
	console.log(choice);

	if (choice === BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData) {
		ctx.api.deleteMessage(ctx.session.chatId!, ctx.session.keyboardMessageId!);
		ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	} else {
		ctx.session.tripRequestFilter.pickup = choice;
		const router = await sceneRouter(ctx);
		ctx.api.deleteMessage(ctx.session.chatId!, ctx.session.keyboardMessageId!);
		const nextScene = router.next();
		if (nextScene === null) {
			ctx.scene.exit();
		}
		else {
			ctx.scene.enter(nextScene);
		}
	}
});