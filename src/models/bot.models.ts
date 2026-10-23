import type { Context, SessionFlavor } from 'grammy';
import type { ScenesFlavor, ScenesSessionData } from 'grammy-scenes';
import type { TripRequestFilter } from './trip.model.js';
import type { LocationList } from './locations.model.js';

export const LOCATION_MENU_PAGE_SIZE = 9;
export const LOCATION_MENU_ROW_SIZE = 3;

type LocationMenuPagination = {
  locationList: LocationList,
  currentPage: number,
  totalPageCount: number
}

type TripTimeList = {
  fetched: string[],
  selected: string[],
}

type SelectedOptions = {
  startLocation: string,
  endLocation: string,
  date: string,
  time: string [],

}

export type SessionData = ScenesSessionData & {
  selectedOptions: SelectedOptions,
  currentSceneIndex: number,
  tripRequestFilter: TripRequestFilter,
  keyboardMessageId?: number;
  chatId?: number;
	sessionMessageHistory: number[];
  locationMenuPagination: LocationMenuPagination;
  tripTimeList: TripTimeList;
}

export type BotCustomContext = Context & SessionFlavor<SessionData> & ScenesFlavor

export enum BotSceneNameList {
  START_LOCATION_SCENE = 'startLocationScene',
  END_LOCATION_SCENE = 'endLocationScene',
  DATE_PICKER_SCENE = 'datePickerScene',
  TRACKING_INTERVAL_SCENE = 'trackingIntervalScene',
	CONFIRM_TRACK_DATA_SCENE = 'confirmTrackDataScene',
  TIME_PICKER_SCENE = 'timePickerScene'
}

type BotInlineKeyboardCommandButton = {
  text: string,
  callbackData: BotInlineKeyboardCommandName
}

enum BotInlineKeyboardCommandName {
  SEARCH_AGAIN = 'search_again',
  NEXT_PAGE = 'next_page',
  PREV_PAGE = 'prev_page',
  CONFIRM = 'confirm',
  RESTART = 'restart',
  CANCEL = 'cancel'
}

enum BotInlineKeyboardCommandText {
  SEARCH_AGAIN = 'Искать снова',
  NEXT_PAGE = '▶️',
  PREV_PAGE = '◀️',
  CONFIRM = '✅ Подтвердить',
  RESTART = 'Начать заново',
  CANCEL = 'Отменить'
}

export const BotInlineKeyboardCommands: Record<BotInlineKeyboardCommandName, BotInlineKeyboardCommandButton> = {
  [BotInlineKeyboardCommandName.SEARCH_AGAIN]: {
    text: BotInlineKeyboardCommandText.SEARCH_AGAIN,
    callbackData: BotInlineKeyboardCommandName.SEARCH_AGAIN,
  },
  [BotInlineKeyboardCommandName.NEXT_PAGE]: {
    text: BotInlineKeyboardCommandText.NEXT_PAGE,
    callbackData: BotInlineKeyboardCommandName.NEXT_PAGE,
  },
  [BotInlineKeyboardCommandName.PREV_PAGE]: {
    text: BotInlineKeyboardCommandText.PREV_PAGE,
    callbackData: BotInlineKeyboardCommandName.PREV_PAGE,
  },
  [BotInlineKeyboardCommandName.CONFIRM]: {
    text: BotInlineKeyboardCommandText.CONFIRM,
    callbackData: BotInlineKeyboardCommandName.CONFIRM,
  },
  [BotInlineKeyboardCommandName.RESTART]: {
    text: BotInlineKeyboardCommandText.RESTART,
    callbackData: BotInlineKeyboardCommandName.RESTART,
  },
  [BotInlineKeyboardCommandName.CANCEL]: {
    text: BotInlineKeyboardCommandText.CANCEL,
    callbackData: BotInlineKeyboardCommandName.CANCEL,
  },
} as const;

export const BotRequestIntervals = [
  {
    text: '1 минута',
    value: 1 * 60 * 1000,
  },
  {
    text: '5 минут',
    value: 5 * 60 * 1000,
  },
  {
    text: '15 минут',
    value: 15 * 60 * 1000,
  },
  {
    text: '30 минут',
    value: 30 * 60 * 1000,
  },

];

export const BotInlineKeyboardConfirmItems = [
  {
    text: 'Подтвердить',
    value: 'confirm',
  },
  {
    text: 'Начать заново',
    value: 'restart',
  },
];
