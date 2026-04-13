import { InlineKeyboard } from 'grammy';
import { BotRequestIntervals } from '../../models/bot.models.js';

export const createInlineKeyboardWithIntervals = () => {
	let keyboard = new InlineKeyboard();

	BotRequestIntervals.forEach((interval) => {
		keyboard = keyboard.text(interval.text, String(interval.value));
	});

	return keyboard;
};