import { Scene } from "grammy-scenes";
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from "../../models/bot.models.js";
import { sceneRouter } from "./router.bot.js";
import { getLocationListWithParams } from "../../db/locations.repo.js";
import { LocationTablePointColumnValue } from "../../models/locations.model.js";
import { createInlineKeyboardWithLocation } from "../components/inlineKeyboardLocationPick.bot.js";

export const endLocationScene = new Scene<BotCustomContext>(BotSceneNameList.END_LOCATION_SCENE);

endLocationScene.label(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData)

endLocationScene.step(async (ctx) => {
    await ctx.reply('Введите название конечного пункта')
})

endLocationScene.wait('startLocation').on('message:text', async (ctx) => {
    ctx.session.enteredEndLocation = ctx.message.text;

    const foundLocations = await getLocationListWithParams({
        name: ctx.session.enteredEndLocation,
        point: LocationTablePointColumnValue.DESTINATION
    })

    if (foundLocations.length === 0) {
        await ctx.reply('Ничего не найдено, попробуйте снова')
    } else {
        const locationsKeyboard = createInlineKeyboardWithLocation(foundLocations)
        const keyboardMessage = await ctx.reply('Найдены следующие пункты. Выберете пожалуйста', {
            reply_markup: locationsKeyboard
        })
        ctx.session.keyboardMessageId = keyboardMessage.message_id;
        ctx.session.chatId = keyboardMessage.chat.id;

        ctx.scene.resume();
    }

})

endLocationScene.wait('chooseLocation').on('callback_query:data', async (ctx) => {
    await ctx.answerCallbackQuery();
    const choice = ctx.callbackQuery.data
    console.log(choice);

    if (choice === BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData) {
        ctx.api.deleteMessage(ctx.session.chatId!, ctx.session.keyboardMessageId!);
        ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData)
    } else {
        ctx.session.tripRequestFilter.pickup = choice;
        const router = await sceneRouter(ctx)
        const nextScene = router.next();
        ctx.api.deleteMessage(ctx.session.chatId!, ctx.session.keyboardMessageId!);
        if (nextScene === null) {
            ctx.scene.exit()
        }
        else {
            ctx.scene.enter(nextScene)
        }
    }
})