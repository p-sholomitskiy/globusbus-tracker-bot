import type { InlineKeyboard } from 'grammy';
import type { BotCustomContext } from '../models/bot.models.js';

export const deleteKeyboardMessage = async (
  ctx: BotCustomContext,
): Promise<void> => {
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
  return (
    ctx.callbackQuery?.message?.message_id === ctx.session.keyboardMessageId
  );
};

export const createConfirmDataMessage = (ctx: BotCustomContext) => {
  const {
    enteredStartLocation,
    enteredEndLocation,
    enteredDate,
    enteredTrackInterval,
  } = ctx.session;

  return `${enteredStartLocation} => ${enteredEndLocation} | ${enteredDate} | ${enteredTrackInterval}`;
};

export const initSessionParamsBeforeFirstScene = (ctx: BotCustomContext) => {
  ctx.session.currentSceneIndex = 0;
  ctx.session.tripRequestFilter = {
    pickup: null,
    destination: null,
    date_of_journey: '',
    seats_limit: null,
  };
  ctx.session.sessionMessageHistory = [];
};

export const sessionMessageHistory = (ctx: BotCustomContext) => {
  const addMessage = (messageId: number | undefined) => {
    if (messageId) {
      ctx.session.sessionMessageHistory.push(messageId);
      console.log(ctx.session.sessionMessageHistory);
    }
  };
  const clear = (): void => {
    ctx.session.sessionMessageHistory = [];
  };
  return {
    addMessage,
    clear,
  };
};

export const botTextMessage = async (
  ctx: BotCustomContext,
  textMessage: string,
  keyboard?: InlineKeyboard,
) => {
  const message = await ctx.reply(textMessage, { reply_markup: keyboard });
  console.log(message.message_id);
  sessionMessageHistory(ctx).addMessage(message.message_id);

  return message;
};
