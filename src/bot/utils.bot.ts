import type { BotCustomContext } from '../models/bot.models.js';

export const deleteKeyboardMessage = async (ctx: BotCustomContext) => {
	const { chatId, keyboardMessageId } = ctx.session;
	if (chatId !== undefined && keyboardMessageId) {
		await ctx.api.deleteMessage(chatId, keyboardMessageId);
		ctx.session.chatId = undefined;
		ctx.session.keyboardMessageId = undefined;
	}
};

export const isActualCallback = (ctx: BotCustomContext) => {
	return ctx.callbackQuery?.message?.message_id === ctx.session.keyboardMessageId;
};