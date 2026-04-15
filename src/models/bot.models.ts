import type { Context, SessionFlavor } from 'grammy';
import type { ScenesFlavor, ScenesSessionData } from 'grammy-scenes';
import type { TripRequestFilter } from './trip.model.js';

export type SessionData = ScenesSessionData & {
    enteredStartLocation?: string,
    enteredEndLocation?: string,
    enteredDate?: string,
    enteredTrackInterval?: number,
    currentSceneIndex: number,
    tripRequestFilter: TripRequestFilter,
    keyboardMessageId?: number;
    chatId?: number;
}

export type BotCustomContext = Context & SessionFlavor<SessionData> & ScenesFlavor

export enum BotSceneNameList {
    START_LOCATION_SCENE = 'startLocationScene',
    END_LOCATION_SCENE = 'endLocationScene',
    DATE_PICKER_SCENE = 'datePickerScene',
    TRACKING_INTERVAL_SCENE = 'trackingIntervalScene',
}

export const BotInlineKeyboardCommands = {
	SEARCH_AGAIN: {
		text: 'Искать снова',
		callBackData: 'search_again',
	}
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