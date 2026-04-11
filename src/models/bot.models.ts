import type { Context, SessionFlavor } from "grammy";
import type { ScenesFlavor, ScenesSessionData } from "grammy-scenes";

export type SessionData = ScenesSessionData & {
    enteredStartLocation?: string,
    enteredEndLocation?: string,
    enteredDate?: string,
    enteredTrackInterval?: number,
    currentSceneIndex: number,
}
export type BotCustomContext = Context & SessionFlavor<SessionData> & ScenesFlavor

export enum BotSceneNameList {
    START_LOCATION_SCENE = 'startLocationScene',
    END_LOCATION_SCENE = 'endLocationScene',
    DATE_PICKER_SCENE = 'datePickerScene',
    TRACKING_INTERVAL_SCENE = 'trackingIntervalScene',
}