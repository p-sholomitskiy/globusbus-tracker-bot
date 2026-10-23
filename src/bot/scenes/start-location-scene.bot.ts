import { Scene } from 'grammy-scenes';
import { BotInlineKeyboardCommands, BotSceneNameList, type BotCustomContext } from '../../models/bot.models.js';
import { sceneRouter } from './router.bot.js';
import { getLocationListWithParams } from '../../db/locations.repo.js';
import { LocationTableColumnsName, LocationTablePointColumnValue } from '../../models/locations.model.js';
import { createInlineKeyboardWithLocation } from '../components/inline-keyboard-location-pick.bot.js';
import { botTextMessage, changePage, deleteKeyboardMessage, getTotalLocationPageCount, isActualCallback, sessionMessageHistory } from '../utils.bot.js';
import { BOT_MESSAGES } from '../messages.bot.js';

export const startLocationScene = new Scene<BotCustomContext>(BotSceneNameList.START_LOCATION_SCENE);

startLocationScene.label(BotInlineKeyboardCommands.search_again.callbackData);

startLocationScene.step(async (ctx) => {
  const foundLocations = await getLocationListWithParams({
    point: LocationTablePointColumnValue.PICKUP,
    orderBy: LocationTableColumnsName.NAME,
  });

  if (!foundLocations?.length) {
    await botTextMessage(ctx, BOT_MESSAGES.LOCATIONS_NOT_FOUNDED);
    return ctx.scene.exit();
  }

  const { locationMenuPagination } = ctx.session;

  locationMenuPagination.locationList = foundLocations;
  locationMenuPagination.currentPage = 0;
  locationMenuPagination.totalPageCount = getTotalLocationPageCount(foundLocations);

  const locationKeyboard = createInlineKeyboardWithLocation(
    locationMenuPagination.locationList,
    locationMenuPagination.currentPage,
    locationMenuPagination.totalPageCount,
  );

  const keyboardMessage = await botTextMessage(ctx, BOT_MESSAGES.CHOOSE_START_LOCATION, locationKeyboard);
  ctx.session.keyboardMessageId = keyboardMessage.message_id;
  ctx.session.chatId = keyboardMessage.chat.id;
});

startLocationScene.wait('chooseLocation').on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
  const selectedButtonData = ctx.callbackQuery.data;
  sessionMessageHistory(ctx).addMessage(ctx.callbackQuery.message?.message_id);

  if (!isActualCallback(ctx)) {
    await deleteKeyboardMessage(ctx);
    return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
  }

  const { locationList } = ctx.session.locationMenuPagination;

  if (selectedButtonData === BotInlineKeyboardCommands.prev_page.callbackData) {
    await changePage(ctx, locationList, 'prev');

    return;
  }

  if (selectedButtonData === BotInlineKeyboardCommands.next_page.callbackData) {
    await changePage(ctx, locationList, 'next');

    return;
  }

  if (selectedButtonData === BotInlineKeyboardCommands.search_again.callbackData) {
    await deleteKeyboardMessage(ctx);
    return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
  }

  const chosenLocation = locationList?.find(location => location.value === Number(selectedButtonData));

  if (chosenLocation === undefined) {
    return ctx.scene.goto(BotInlineKeyboardCommands.search_again.callbackData);
  }

  ctx.session.tripRequestFilter.pickup = chosenLocation.value;
  ctx.session.selectedOptions.startLocation = chosenLocation.name;

  const router = await sceneRouter(ctx);

  await ctx.editMessageText(`${BOT_MESSAGES.CHOSEN_START_LOCATION}: ${chosenLocation.name}`);

  const nextScene = router.next();

  if (nextScene === null) {
    return ctx.scene.exit();
  }

  return ctx.scene.enter(nextScene);
});
