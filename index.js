'use strict';

/**
 * LCTV Bot :)
 */
const Bot = require('./utils/Bot');
const LegacyAdapter = require('./utils/LegacyAdapter');
const credentials = require('./setup/custom/credentials');
const Brain = require('./utils/Brain');
const ChatBot = require('./utils/ChatBot');
const Client = require('./utils/Client');
let api = require('./plugins/interface/index').appAPI;

// Build the initial runtime object
let runtime = require('./utils/Runtime');
runtime.debug = process.argv[2] === 'debug' || false;
runtime.coreCommands = null;
runtime.pluginCommands = null;
runtime.websocketCommands = null;
runtime.startUpTime = new Date().getTime();
runtime.credentials = credentials;
runtime.brain = new Brain(api);


// Verify credentials exist
if (!runtime.credentials.username || !runtime.credentials.room || !runtime.credentials.password || !runtime.credentials.jid || !runtime.credentials.roomJid) {
  console.error('ERROR: Credentials file is missing required attributes. Please check your credentials.js');
  console.log('[bot] Quitting startup process.');
  return;
}


runtime.brain.start(__dirname + "/brain");
let chat = new Client(runtime.credentials);
let newBot = new Bot(runtime.brain);

newBot.use((bot, req, next) => {
  // simple example of timestamp middleware
  // Skip the messages before the bot was started
  const messageTime = new Date().getTime();
  if (messageTime - runtime.startUpTime > 10000) {
    req.time = messageTime;
    next();
  }
});

newBot.use((bot, req, next) => {
  // simple example of middleware
  // should only show new messages via above
  console.log(req);
  next();
});



newBot.use((bot, req, next) => {
  //Example of rate limiting middleware
  let messages = bot.brain.get('userMessages') || {};
  let userMessageLog = messages[req.user];

  // Don't rate limit the bot
  if (req.user !== credentials.username && userMessageLog) {
    let lastCommandTimeExists = userMessageLog.lastCommandTime > 0;
    if (lastCommandTimeExists && now - userMessageLog.lastCommandTime < 3000) { // 3 seconds
      message.rateLimited = true;
    }
  }
  // no other middleware triggered by rate limit
  if (!req.rateLimited)
    next();
});


// example of parrot bot
// don't repeat yourself
newBot.use((bot, req, next) => {
  if (req.type === "message" && req.user.username !== credentials.username)
    bot.say("You said \"" + req.message + "\"?");
});


//example of legacy adapter
const PointPlugin = require('./plugins/points');
newBot.use(LegacyAdapter(PointPlugin));

newBot.listen(chat, 'onMessage');
