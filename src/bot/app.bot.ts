import { Bot } from "grammy";
import { TELEGRAM_BOT_TOKEN } from "../config.js";
import type { BotCustomContext } from "../models/bot.models.js";

export const bot = new Bot<BotCustomContext>(TELEGRAM_BOT_TOKEN)