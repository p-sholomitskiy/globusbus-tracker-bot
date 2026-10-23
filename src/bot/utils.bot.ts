import type { InlineKeyboard } from 'grammy';
import { LOCATION_MENU_PAGE_SIZE, type BotCustomContext } from '../models/bot.models.js';
import type { LocationList } from '../models/locations.model.js';
import { updateLocationKeyboard } from './components/inline-keyboard-location-pick.bot.js';

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

export const isActualCallback = (ctx: BotCustomContext): boolean => {
  const messageId = ctx.callbackQuery?.message?.message_id;

  return (
    messageId !== undefined &&
    messageId === ctx.session.keyboardMessageId
  );
};

export const createConfirmDataMessage = (ctx: BotCustomContext) => {
  // const {
  //   enteredStartLocation,
  //   enteredEndLocation,
  //   enteredDate,
  //   enteredTrackInterval,
  // } = ctx.session;

  // return `${enteredStartLocation} => ${enteredEndLocation} | ${enteredDate} | ${enteredTrackInterval}`;
  const { selectedOptions, tripRequestFilter, tripTimeList } = ctx.session;
  return `Проверьте подписку:\n🚌 ${selectedOptions.startLocation} → ${selectedOptions.endLocation}\nДата: ${tripRequestFilter.date_of_journey}\nВремя: ${tripTimeList.selected.join(', ')}\nМест: ${tripRequestFilter.seats_limit}`;
};

export const initSessionParamsBeforeFirstScene = (ctx: BotCustomContext) => {
  ctx.session.currentSceneIndex = 0;
  ctx.session.tripRequestFilter = {
    pickup: null,
    destination: null,
    date_of_journey: '',
    seats_limit: 1,
  };
  ctx.session.locationMenuPagination = {
    locationList: [],
    currentPage: 0,
    totalPageCount: 1,
  };
  ctx.session.selectedOptions = {
    startLocation: '',
    endLocation: '',
    date: '',
    time: [],
  };
  ctx.session.sessionMessageHistory = [];
  ctx.session.tripTimeList = {
    selected: [],
    fetched: [],
  };
};

export const sessionMessageHistory = (ctx: BotCustomContext) => {
  const addMessage = (messageId: number | undefined) => {
    if (messageId) {
      ctx.session.sessionMessageHistory.push(messageId);
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
  sessionMessageHistory(ctx).addMessage(message.message_id);

  return message;
};

export const getTotalLocationPageCount = (locationList: LocationList): number => {
  return Math.ceil(locationList.length / LOCATION_MENU_PAGE_SIZE);
};

export const getPaginatedPage = (locationList: LocationList, currentPageNumber: number) => {
  const start = currentPageNumber * LOCATION_MENU_PAGE_SIZE;

  return locationList.slice(start, start + LOCATION_MENU_PAGE_SIZE);
};

export const changePage = async (
  ctx: BotCustomContext,
  locationList: LocationList,
  direction: 'prev' | 'next',
) => {
  const totalPageCount = ctx.session.locationMenuPagination?.totalPageCount ?? 1;
  const currentPage = ctx.session.locationMenuPagination?.currentPage ?? 0;

  const nextPage = direction === 'prev' ? currentPage - 1 : currentPage + 1;

  if (nextPage < 0 || nextPage >= totalPageCount) {
    return;
  }

  ctx.session.locationMenuPagination.currentPage = nextPage;

  await updateLocationKeyboard(
    ctx,
    locationList,
  );
};
