import { ScenesComposer } from 'grammy-scenes';
import { startLocationScene } from '../scenes/startLocationScene.bot.js';
import { endLocationScene } from '../scenes/endLocationScene.bot.js';
import { trackingIntervalScene } from '../scenes/trackingIntervalScene.bot.js';
import { datePickerScene } from '../scenes/datePickerScene.bot.js';
import { BotSceneNameList } from '../../models/bot.models.js';

export const mainStage = new ScenesComposer(startLocationScene, endLocationScene, 
    datePickerScene, trackingIntervalScene);

export const stageOrder = [
    BotSceneNameList.START_LOCATION_SCENE,
    BotSceneNameList.END_LOCATION_SCENE,
    BotSceneNameList.DATE_PICKER_SCENE,
    BotSceneNameList.TRACKING_INTERVAL_SCENE
];