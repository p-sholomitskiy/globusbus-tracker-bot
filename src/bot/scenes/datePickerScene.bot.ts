import { Scene } from 'grammy-scenes';
import { BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { createInlineKeyboardWithDates } from '../components/inlineKeyboardDatePick.bot.js';

export const datePickerScene = new Scene<BotCustomContext>(BotSceneNameList.DATE_PICKER_SCENE);

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
	if (ctx.callbackQuery.message?.message_id === ctx.session.keyboardMessageId){

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
	}
});