import { Scene } from "grammy-scenes";
import { BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { sceneRouter } from "./router.bot.js";

export const endLocationScene = new Scene<BotCustomContext>(BotSceneNameList.END_LOCATION_SCENE);

endLocationScene.step(async (ctx) => {
    await ctx.reply(JSON.stringify(ctx.session))
})

endLocationScene.wait('endLocation').on('message:text', async (ctx) => {
    ctx.session.enteredEndLocation = ctx.message.text;

    const router = await sceneRouter(ctx)
    const nextScene = router.next()
    console.log(nextScene)
    if (nextScene === null) {
        ctx.scene.exit()
    }
    else {
        ctx.scene.enter(nextScene)
    }
})