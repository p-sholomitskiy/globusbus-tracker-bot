import { InlineKeyboard } from 'grammy';
import { BotInlineKeyboardCommands } from '../../models/bot.models.js';

export const createInlineKeyboardWithUpdateSubscription = () => {
  const keyboard = new InlineKeyboard();

  keyboard.text(BotInlineKeyboardCommands.confirm.text, 'update_subscription').row();
  keyboard.text(BotInlineKeyboardCommands.cancel.text, BotInlineKeyboardCommands.cancel.callbackData).row();

  return keyboard;
};
