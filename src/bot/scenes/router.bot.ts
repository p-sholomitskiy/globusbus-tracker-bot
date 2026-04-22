import { BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { stageOrder } from '../stage/mainStage.bot.js';

export const sceneRouter = async (ctx: BotCustomContext) => {
  const currentIndex = ctx.session.currentSceneIndex;

  const getSceneAtIndex = (index: number): BotSceneNameList | null => {
    if (index < 0 || index >= stageOrder.length) {
      return null;
    }
    return stageOrder[index] ?? null;
  };

  const updateIndex = (newIndex: number): BotSceneNameList | null => {
    const scene = getSceneAtIndex(newIndex);
    if (scene) {
      ctx.session.currentSceneIndex = newIndex;
    }
    return scene;
  };

  return {
    next: () => updateIndex(currentIndex + 1),
    prev: () => updateIndex(currentIndex - 1),
    current: () => stageOrder[currentIndex],
  };
};