import { InlineKeyboard } from 'grammy';
import { BotInlineKeyboardCommands } from '../../models/bot.models.js';

export const createInlineKeyboardWithTripTime = (tripTimeList: string[], selectedTripTimeList: string[]) => {
  let keyboard = new InlineKeyboard();

  tripTimeList.forEach((tripTime) => {
    const selected = selectedTripTimeList.includes(tripTime);
    keyboard = keyboard.text(
      `${selected ? '✅' : '☑️'} ${tripTime}`,
      tripTime,
    );
  });

  keyboard = keyboard.row();

  keyboard = keyboard.text(BotInlineKeyboardCommands.confirm.text, BotInlineKeyboardCommands.confirm.callbackData);

  return keyboard;
};
