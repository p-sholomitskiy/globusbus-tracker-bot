import { Scene } from "grammy-scenes";
import { BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { sceneRouter } from "./router.bot.js";

export const trackingIntervalScene = new Scene<BotCustomContext>(BotSceneNameList.TRACKING_INTERVAL_SCENE);

trackingIntervalScene.step(async (ctx) => {
    await ctx.reply('Enter interval')
})

trackingIntervalScene.wait('trackingInterval').on('message:text', async (ctx) => {
    ctx.session.enteredTrackInterval = Number(ctx.message.text);

    const router = await sceneRouter(ctx);
    const nextScene = router.next();
    if (nextScene === null) {
        ctx.scene.exit()
    }
    else {
        ctx.scene.enter(nextScene)
    }
})