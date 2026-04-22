import { InlineKeyboard } from 'grammy';
import { BotInlineKeyboardConfirmItems } from '../../models/bot.models.js';

export const createInlineKeyboardWithConfirm = () => {
	let keyboard = new InlineKeyboard();

	BotInlineKeyboardConfirmItems.forEach((button) => {
		keyboard = keyboard.text(button.text, String(button.value)).row();
	});

	return keyboard;
};