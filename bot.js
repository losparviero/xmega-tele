#!/usr/bin/env node

/*!
 * xMegaDrive Telegram Bot
 * Copyright (c) 2023
 *
 * @author Zubin
 * @username (GitHub) losparviero
 * @license AGPL-3.0
 */

// Add env vars as a preliminary

require("dotenv").config();
const { Bot, session, InputFile, GrammyError, HttpError } = require("grammy");
const { hydrateReply, parseMode } = require("@grammyjs/parse-mode");
const { run, sequentialize } = require("@grammyjs/runner");

const { hydrate } = require("@grammyjs/hydrate");
const Downloader = require("nodejs-file-downloader");
const { extractVideoSrc } = require("./src/handler");

// Bot

const bot = new Bot(process.env.BOT_TOKEN);

// Concurrency

function getSessionKey(ctx) {
  return ctx.chat?.id.toString();
}

// Plugins

bot.use(sequentialize(getSessionKey));
bot.use(session({ getSessionKey }));
bot.use(responseTime);
bot.use(log);
bot.use(admin);
bot.use(hydrate());
bot.use(hydrateReply);

// Parse

bot.api.config.use(parseMode("Markdown"));

// Admin

const admins = process.env.BOT_ADMIN?.split(",").map(Number) || [];
async function admin(ctx, next) {
  ctx.config = {
    botAdmins: admins,
    isAdmin: admins.includes(ctx.chat?.id),
  };
  await next();
}

// Response

async function responseTime(ctx, next) {
  const before = Date.now();
  await next();
  const after = Date.now();
  console.log(`Response time: ${after - before} ms`);
}

// Log

async function log(ctx, next) {
  const from = ctx.from;
  const name =
    from.last_name === undefined
      ? from.first_name
      : `${from.first_name} ${from.last_name}`;
  console.log(
    `From: ${name} (@${from.username}) ID: ${from.id}\nMessage: ${ctx.message.text}`
  );

  const msgText = ctx.message.text;

  if (!msgText.includes("/") && !admins.includes(ctx.chat?.id)) {
    await bot.api.sendMessage(
      process.env.BOT_ADMIN,
      `<b>From: ${ctx.from.first_name} (@${ctx.from.username}) ID: <code>${ctx.from.id}</code></b>`,
      { parse_mode: "HTML" }
    );
    await ctx.api.forwardMessage(
      process.env.BOT_ADMIN,
      ctx.chat.id,
      ctx.message.message_id
    );
  }

  await next();
}

// Commands

bot.command("start", async (ctx) => {
  await ctx
    .reply("*Welcome!* ✨\n_Send a xMegaDrive link._")
    .then(console.log("New user added:\n", ctx.from))
    .catch((e) => console.log(e));
});

bot.command("help", async (ctx) => {
  await ctx
    .reply(
      "*@anzubo Project.*\n\n_This is a chat bot using OpenAI's Chat API.\nAsk any query to get started!_"
    )
    .then(console.log("Help command sent to", ctx.chat.id))
    .catch((e) => console.log(e));
});

// Download

bot.on("message::url", async (ctx) => {
  const statusMessage = await ctx.reply("*Downloading*");

  const downloadLink = await extractVideoSrc(ctx.message.text).then(
    async (src) => {
      if (src !== undefined) {
        await ctx.reply("Can't download video.");
        return;
      }
    }
  );

  const downloader = new Downloader({
    url: downloadLink,
    directory: "./",
    onBeforeSave: (deducedName) => {
      console.log(`The file name is: ${deducedName}`);
    },
  });

  try {
    await downloader.download();
    console.log("Video downloaded");
    await ctx.replyWithVideo(new InputFile(deducedName));
  } catch (error) {
    console.log("Download failed", error);
  }

  await await statusMessage.delete();
});

// Messages

bot.on("message:text", async (ctx) => {
  await ctx.reply("*Send a valid xMegaDrive link.*");
});

// Error

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(
    "Error while handling update",
    ctx.update.update_id,
    "\nQuery:",
    ctx.msg.text
  );
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description);
    if (e.description === "Forbidden: bot was blocked by the user") {
      console.log("Bot was blocked by the user");
    } else {
      ctx.reply("An error occurred");
    }
  } else if (e instanceof HttpError) {
    console.error("Could not contact Telegram:", e);
  } else {
    console.error("Unknown error:", e);
  }
});

// Run

run(bot);
