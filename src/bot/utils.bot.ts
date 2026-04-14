import type { BotCustomContext } from '../models/bot.models.js';

export const deleteKeyboardMessage = async (ctx: BotCustomContext): Promise<void> => {
	const { chatId, keyboardMessageId } = ctx.session;
	
	try {
		if (chatId !== undefined && keyboardMessageId !== undefined) {
			await ctx.api.deleteMessage(chatId, keyboardMessageId);
		}	
	} catch (error) {
		console.log(error);
	} finally {
		ctx.session.chatId = undefined;
		ctx.session.keyboardMessageId = undefined;
	}
};

export const isActualCallback = (ctx: BotCustomContext) => {
	return ctx.callbackQuery?.message?.message_id === ctx.session.keyboardMessageId;
};

export const initSessionParamsBeforeFirstScene = (ctx: BotCustomContext) => {
	ctx.session.currentSceneIndex = 0;
	ctx.session.tripRequestFilter = {
		pickup: '',
		destination: '',
		date_of_journey: '',
		seats_limit: '',
	};
}; 