import { BotSceneExecutionResult, BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { stageOrder } from "../stage.bot.ts/mainStage.bot.js";

export const getNextScene = async (ctx: BotCustomContext): Promise<BotSceneNameList | null> => {

    let newIndex = ctx.session.currentSceneIndex;

    switch (ctx.session.currentSceneExecutionResult) {

        case BotSceneExecutionResult.NEXT:
            newIndex++;
            break;

        case BotSceneExecutionResult.PREV:
            newIndex--;
            break;
    }

    const nextScene = stageOrder[newIndex];
    if (!nextScene) return null;

    ctx.session.currentSceneIndex = newIndex;

    return nextScene;
};