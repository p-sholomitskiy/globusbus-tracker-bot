import { InlineKeyboard } from 'grammy';
import type { LocationList, LocationListItem } from '../../models/locations.model.js';
import { BotInlineKeyboardCommands } from '../../models/bot.models.js';

export const createInlineKeyboardWithLocation = (locationList: LocationList): InlineKeyboard => {
  let keyboard = new InlineKeyboard();
  locationList.forEach((locationListItem: LocationListItem, index: number) => {
    if (index !== 0 && index%3 === 0){
      keyboard = keyboard.row();
    }
    keyboard = keyboard.text(`${locationListItem.name}`, `${locationListItem.value}`);
  });
  keyboard = keyboard.row().text(BotInlineKeyboardCommands.SEARCH_AGAIN.text, 
    BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);

  return keyboard;
};