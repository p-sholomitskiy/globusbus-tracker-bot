import { ScenesComposer } from 'grammy-scenes';
import { startLocationScene } from '../scenes/start-location-scene.bot.js';
import { endLocationScene } from '../scenes/end-location-scene.bot.js';
import { datePickerScene } from '../scenes/date-picker-scene.bot.js';
import { BotSceneNameList } from '../../models/bot.models.js';
import { confirmTrackDataScene } from '../scenes/confirm-track-data.bot.js';
import { timePickerScene } from '../scenes/time-picker-scene.bot.js';

export const mainStage = new ScenesComposer(startLocationScene, endLocationScene,
  datePickerScene, timePickerScene, confirmTrackDataScene);

export const stageOrder = [
  BotSceneNameList.START_LOCATION_SCENE,
  BotSceneNameList.END_LOCATION_SCENE,
  BotSceneNameList.DATE_PICKER_SCENE,
  BotSceneNameList.TIME_PICKER_SCENE,
  BotSceneNameList.CONFIRM_TRACK_DATA_SCENE,
];
