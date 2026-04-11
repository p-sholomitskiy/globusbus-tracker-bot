import { Scene } from "grammy-scenes";
import { BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { sceneRouter } from "./router.bot.js";

export const startLocationScene = new Scene<BotCustomContext>(BotSceneNameList.START_LOCATION_SCENE);

startLocationScene.step(async (ctx) => {
    await ctx.reply(JSON.stringify(ctx.session))
})

startLocationScene.wait('startLocation').on('message:text', async (ctx) => {
    ctx.session.enteredStartLocation = ctx.message.text;

    const router = await sceneRouter(ctx)
    const nextScene = router.next();
    if (nextScene === null) {
        ctx.scene.exit()
    }
    else {
        ctx.scene.enter(nextScene)
    }

})