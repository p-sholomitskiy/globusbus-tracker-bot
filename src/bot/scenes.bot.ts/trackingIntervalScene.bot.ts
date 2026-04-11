import { Scene } from "grammy-scenes";
import { BotSceneExecutionResult, BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { getNextScene } from "./router.bot.js";

export const trackingIntervalScene = new Scene<BotCustomContext>(BotSceneNameList.TRACKING_INTERVAL_SCENE);

trackingIntervalScene.step(async (ctx) => {
    await ctx.reply('Enter interval')
})

trackingIntervalScene.wait('endLocation').on('message:text', async (ctx) => {
    ctx.session.enteredTrackInterval = Number(ctx.message.text);
    ctx.session.currentSceneExecutionResult = BotSceneExecutionResult.NEXT;

    const nextScene = await getNextScene(ctx);
    console.log(nextScene)
    if (nextScene === null) {
        ctx.scene.exit()
    }
    else {
        ctx.scene.enter(nextScene)
    }
})