import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { getLocationListWithParams } from '../../db/locations.repo.js';
import { LocationTablePointColumnValue } from '../../models/locations.model.js';
import { createInlineKeyboardWithLocation } from '../components/inlineKeyboardLocationPick.bot.js';
import { botTextMessage, deleteKeyboardMessage, isActualCallback, sessionMessageHistory } from '../utils.bot.js';

export const endLocationScene = new Scene<BotCustomContext>(
  BotSceneNameList.END_LOCATION_SCENE,
);

endLocationScene.label(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);

endLocationScene.step(async (ctx) => {
  const startSceneMessage = await botTextMessage(ctx, 'Введите название конечного пункта');
});

endLocationScene.wait('startLocation').on('message:text', async (ctx) => {
  ctx.session.enteredEndLocation = ctx.message.text;

  const foundLocations = await getLocationListWithParams({
    name: ctx.session.enteredEndLocation,
    point: LocationTablePointColumnValue.DESTINATION,
  });

  if (foundLocations === null) {
    const errorBotMessage = await botTextMessage(ctx, 'При поиске возникла ошибка. Попробуйте еще раз.');
    return ctx.scene.goto(BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData);
  }

  if (foundLocations.length === 0) {
    const noResultMessage = await botTextMessage(ctx, 'Ничего не найдено, попробуйте снова');
  } else {
    ctx.session.foundEndLocation = foundLocations;
    const locationsKeyboard = createInlineKeyboardWithLocation(foundLocations);
    const keyboardMessage = await botTextMessage(ctx, 'Найдены следующие пункты. Выберете пожалуйста', locationsKeyboard);
    ctx.session.keyboardMessageId = keyboardMessage.message_id;
    ctx.session.chatId = keyboardMessage.chat.id;

    ctx.scene.resume();
  }
});

endLocationScene
  .wait('chooseLocation')
  .on('callback_query:data', async (ctx) => {
    await ctx.answerCallbackQuery();
    const choice = ctx.callbackQuery.data;

    if (!isActualCallback(ctx)) {
      await deleteKeyboardMessage(ctx);
      return ctx.scene.goto(
        BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData,
      );
    }

    if (choice === BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData) {
      await deleteKeyboardMessage(ctx);
      return ctx.scene.goto(
        BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData,
      );
    }

    const chosenLocation = ctx.session.foundEndLocation?.find(
      (location) => location.value === Number(choice),
    );

    if (chosenLocation === undefined) {
      return ctx.scene.goto(
        BotInlineKeyboardCommands.SEARCH_AGAIN.callBackData,
      );
    }

    ctx.session.tripRequestFilter.destination = chosenLocation.value;
    ctx.session.enteredEndLocation = chosenLocation.name;

    const router = await sceneRouter(ctx);
    await deleteKeyboardMessage(ctx);

    const nextScene = router.next();

    if (nextScene === null) {
      return ctx.scene.exit();
    }

    return ctx.scene.enter(nextScene);
  });
