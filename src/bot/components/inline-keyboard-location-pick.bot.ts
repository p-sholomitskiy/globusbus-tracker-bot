import { InlineKeyboard } from 'grammy';
import type { LocationList, LocationListItem } from '../../models/locations.model.js';
import { BotInlineKeyboardCommands, LOCATION_MENU_ROW_SIZE, type BotCustomContext } from '../../models/bot.models.js';
import { getPaginatedPage } from '../utils.bot.js';

export const createInlineKeyboardWithLocation = (
  pageList: LocationList,
  currentPageNumber: number,
  totalPageCount: number,
): InlineKeyboard => {
  let keyboard = new InlineKeyboard();

  const paginatedPageList = getPaginatedPage(pageList, currentPageNumber);

  paginatedPageList.forEach((locationListItem: LocationListItem, index: number) => {
    if (index%LOCATION_MENU_ROW_SIZE === 0){
      keyboard = keyboard.row();
    }
    keyboard = keyboard.text(`${locationListItem.name}`, `${locationListItem.value}`);
  });

  keyboard = keyboard.row();
  if (currentPageNumber > 0) {
    keyboard = keyboard.text(
      `${BotInlineKeyboardCommands.prev_page.text}`,
      `${BotInlineKeyboardCommands.prev_page.callbackData}`,
    );
  }
  if (currentPageNumber < totalPageCount - 1) {
    keyboard = keyboard.text(
      `${BotInlineKeyboardCommands.next_page.text}`,
      `${BotInlineKeyboardCommands.next_page.callbackData}`,
    );
  }

  return keyboard;
};

export const updateLocationKeyboard = async (
  ctx: BotCustomContext,
  locationList: LocationList,
): Promise<void> => {

  const { currentPage, totalPageCount } = ctx.session.locationMenuPagination;

  const keyboard = createInlineKeyboardWithLocation(
    locationList,
    currentPage,
    totalPageCount,
  );

  await ctx.editMessageReplyMarkup({
    reply_markup: keyboard,
  });
};
