import { InlineKeyboard } from 'grammy';
import type { LocationList, LocationListItem } from '../../models/locations.model.js';
import { BotInlineKeyboardCommands } from '../../models/bot.models.js';

export const createInlineKeyboardWithLocation = (locationList: LocationList): InlineKeyboard => {
	let keyboard = new InlineKeyboard();
	locationList.forEach((locationListItem: LocationListItem) => {
		keyboard = keyboard.text(`${locationListItem.name}`, `${locationListItem.value}`);
	});
	keyboard = keyboard.text(BotInlineKeyboardCommands.SEARCH_AGAIN.text, 
		BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);

	return keyboard;
};