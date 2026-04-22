import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { getLocationListWithParams } from '../../db/locations.repo.js';
import { LocationTablePointColumnValue } from '../../models/locations.model.js';
import { createInlineKeyboardWithLocation } from '../components/inlineKeyboardLocationPick.bot.js';
import { botTextMessage, deleteKeyboardMessage, isActualCallback, sessionMessageHistory } from '../utils.bot.js';

export const startLocationScene = new Scene<BotCustomContext>(BotSceneNameList.START_LOCATION_SCENE);

startLocationScene.label(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);

startLocationScene.step(async (ctx) => {
	const sceneMessage = await botTextMessage(ctx, 'Введите название отправного пункта');
});

startLocationScene.wait('startLocation').on('message:text', async (ctx) => {
	ctx.session.enteredStartLocation = ctx.message.text;
	console.log(ctx.session.enteredStartLocation);
	const foundLocations = await getLocationListWithParams({
		name: ctx.session.enteredStartLocation,
		point: LocationTablePointColumnValue.PICKUP
	});

	if (foundLocations === null) {
		const errorBotMessage = await botTextMessage(ctx, 'При поиске возникла ошибка. Попробуйте еще раз.');
		return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	}

	if (foundLocations.length === 0) {
		const noResultMessage = await botTextMessage(ctx, 'Ничего не найдено, попробуйте снова');
	} else {
		ctx.session.foundStartLocation = foundLocations;
		const locationsKeyboard = createInlineKeyboardWithLocation(foundLocations);
		const keyboardMessage = await botTextMessage(ctx, 'Найдены следующие пункты. Выберете пожалуйста', locationsKeyboard);
		ctx.session.keyboardMessageId = keyboardMessage.message_id;
		ctx.session.chatId = keyboardMessage.chat.id;

		ctx.scene.resume();
	}

});

startLocationScene.wait('chooseLocation').on('callback_query:data', async (ctx) => {
	await ctx.answerCallbackQuery();
	const choice = ctx.callbackQuery.data;
	sessionMessageHistory(ctx).addMessage(ctx.callbackQuery.message?.message_id);

	if (!isActualCallback(ctx)) {
		await deleteKeyboardMessage(ctx);
		return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	}

	if (choice === BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData) {
		await deleteKeyboardMessage(ctx);
		return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	}

	const chosenLocation = ctx.session.foundStartLocation
		?.find(location => location.value === Number(choice));

	if (chosenLocation === undefined) {
		return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
	}

	ctx.session.tripRequestFilter.pickup = chosenLocation.value;
	ctx.session.enteredStartLocation = chosenLocation.name;

	const router = await sceneRouter(ctx);
	await deleteKeyboardMessage(ctx);

	const nextScene = router.next();

	if (nextScene === null) {
		return ctx.scene.exit();
	}
    
	return ctx.scene.enter(nextScene);
});
