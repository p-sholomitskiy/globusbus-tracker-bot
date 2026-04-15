import type { BotCustomContext } from '../models/bot.models.js';

export const deleteKeyboardMessage = async (ctx: BotCustomContext): Promise<void> => {
	const { chatId, keyboardMessageId } = ctx.session;
	
	if (chatId === undefined || keyboardMessageId === undefined) {
		return;
	}

	try {
		await ctx.api.deleteMessage(chatId, keyboardMessageId);	
		ctx.session.chatId = undefined;
		ctx.session.keyboardMessageId = undefined;
	} catch (error) {

		console.error('Failed to delete keyboard message:', error);
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