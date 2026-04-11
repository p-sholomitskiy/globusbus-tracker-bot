import { Scene } from "grammy-scenes";
import { BotSceneExecutionResult, BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { getNextScene } from "./router.bot.js";

export const endLocationScene = new Scene<BotCustomContext>(BotSceneNameList.END_LOCATION_SCENE);

endLocationScene.step(async (ctx) => {
    await ctx.reply(JSON.stringify(ctx.session))
})

endLocationScene.wait('endLocation').on('message:text', async (ctx) => {
    ctx.session.enteredEndLocation = ctx.message.text;
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