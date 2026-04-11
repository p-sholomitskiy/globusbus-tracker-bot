import { Scene } from "grammy-scenes";
import { BotSceneExecutionResult, BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { getNextScene } from "./router.bot.js";

export const datePickerScene = new Scene<BotCustomContext>(BotSceneNameList.DATE_PICKER_SCENE);

datePickerScene.step(async (ctx) => {
    await ctx.reply('Enter the date')
})

datePickerScene.wait('datePicker').on('message:text', async (ctx) => {
    ctx.session.enteredDate = ctx.message.text;
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