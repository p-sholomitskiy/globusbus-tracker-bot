import { Scene } from "grammy-scenes";
import { BotSceneExecutionResult, BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { getNextScene } from "./router.bot.js";

export const startLocationScene = new Scene<BotCustomContext>(BotSceneNameList.START_LOCATION_SCENE);

startLocationScene.step(async (ctx) => {
    await ctx.reply(JSON.stringify(ctx.session))
})

startLocationScene.wait('startLocation').on('message:text', async (ctx) => {
    ctx.session.enteredStartLocation = ctx.message.text;
    ctx.session.currentSceneExecutionResult = BotSceneExecutionResult.NEXT

    const nextScene = await getNextScene(ctx);
    if (nextScene === null) {
        ctx.scene.exit()
    }
    else {
        ctx.scene.enter(nextScene)
    }

})