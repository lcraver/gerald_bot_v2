'use strict';

// ---- Prototypes ---- //

// Escapes Regular Expression String
RegExp.escape = function(s) {
   return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

// Escapes Regular Expression String
String.prototype.escapeNonCharacters = function() {
   return this.replace(/\?/g, ' $&');
};

String.prototype.indexOfRegex = function(regex){
  var match = this.match(regex);
  return match ? this.indexOf(match[0]) : -1;
}

// ---- References ---- //

const Say = require('../../utils/Say');
const runtime = require('../../utils/Runtime');
const Client = require('../../utils/Client');
const pluginSettings = require('./settings.json');

const TagDB = require('./database/tags.json');
const PatternDB = require('./database/patterns.json');
const SynonymsDB = require('./database/synonyms.json');

const geraldChatReplace = "@" + runtime.credentials.username + ": ";

let BOTMOOD = "normal";

// ---- Functions ---- //

module.exports = [{
    types: ['interface'],
  	action: function(api) {

      api.get('/chat/db/:type', function(req, res, type)
  		{
  			let baseDir = __dirname.substr(0, __dirname.lastIndexOf("\\"));
  			res.sendFile(baseDir + "/chat/database/"+req.params.type+".json");
  		});
    }
  },
  {
	name: 'Chat',
	help: 'Captures messages to gerald and chats with user.',
  types: ['message'],
  regex: new RegExp(RegExp.escape(geraldChatReplace) + "|" + RegExp.escape(runtime.credentials.username)),
  action: function( chat, stanza ) {
		let user = stanza.user.username;
		let userMessage = stanza.message.replace(geraldChatReplace, '');

    let tags = GetTags(userMessage);
		//chat.sendMessage("Tags: [" + tags.toString() + "]");
    let tagPattern = GetPattern(tags);
    //chat.sendMessage("Best Pattern: [" + tagPattern.pattern.toString() + "]");
    //chat.sendMessage("Response: [" + tagPattern.responses[BOTMOOD].toString() + "]");
    let response = GetResponse(stanza, tagPattern.responses[BOTMOOD]);
    //chat.sendMessage("Response Final: " + response.toString());
    chat.sendMessage(response.toString());

    Say.say(response.toString(), "Zira");
  }
}];

function GetTags(chat) {

  chat = " " + chat.toLowerCase() + " ";
  chat = chat.escapeNonCharacters();

  let tagArray = [];

  let tags = Object.keys(TagDB);

  for(let i = 0; i < tags.length; i++)
  {
    for(let j = 0; j < TagDB[tags[i]].length; j++)
    {
      let regexStr = "[" + RegExp.escape(". ,") + "]" + RegExp.escape(TagDB[tags[i]][j].toLowerCase()) + "[" + RegExp.escape(".?! ,") + "]";
      let regex = new RegExp(regexStr);
      if(chat.match(regex) != null)
      {
        let tag = {
          location: chat.indexOfRegex(regex),
          tag: tags[i]
        };
        tagArray.push(tag);
      }
    }
  }

  console.log(tagArray);

  tagArray.sort(function(a, b) {
      return a.location - b.location;
  })

  let tagArrayToReturn = [];

  for(let i = 0; i < tagArray.length; i++)
  {
    tagArrayToReturn.push(tagArray[i].tag);
  }

  console.log(tagArrayToReturn);

  return tagArrayToReturn;
}

function GetPattern(pattern) {

  let currentPattern = {
    pattern: [],
    numOfMatchesTotal: -1,
    numOfMatchesInOrder: -1,
    responses : {}
  };

  let bestPattern = {
    pattern: [],
    numOfMatchesTotal: -1,
    numOfMatchesInOrder: -1,
    responses : {}
  };

  for(let j = 0; j < PatternDB.length; j++)
  {
    let currentPatternArray = PatternDB[j].pattern;
    let currentPatternArray2 = PatternDB[j].pattern;
    currentPattern.pattern = currentPatternArray;
    currentPattern.responses = PatternDB[j].responses;
    currentPattern.numOfMatchesTotal = 0;
    currentPattern.numOfMatchesInOrder = 0;

    let currentMatch = 0;

    for(let i = 0; i < pattern.length; i++)
    {
      if(currentPatternArray[currentMatch] == pattern[i])
      {
        currentMatch++;
        currentPattern.numOfMatchesInOrder++;
      }

      if(currentPatternArray2.indexOf(pattern[i]) != -1)
      {
        currentPattern.numOfMatchesTotal++;
        //delete currentPatternArray2.indexOf(pattern[i]);
      }
    }

    //console.log(bestPattern.numOfMatchesTotal + "<" + currentPattern.numOfMatchesTotal);
    //console.log(bestPattern.numOfMatchesInOrder + "<=" + currentPattern.numOfMatchesInOrder);

    if(bestPattern.numOfMatchesTotal <= currentPattern.numOfMatchesTotal)
    {
      if(bestPattern.numOfMatchesInOrder <= currentPattern.numOfMatchesInOrder)
      {
          bestPattern = {
            pattern: currentPattern.pattern,
            numOfMatchesTotal: currentPattern.numOfMatchesTotal,
            numOfMatchesInOrder: currentPattern.numOfMatchesInOrder,
            responses: currentPattern.responses
          }
      }
    }

    //console.log("\n\n");
  }

  return bestPattern;
}

function GetResponse(stanza, response) {

  let pointData = runtime.brain.get('points') || {};
  let user = stanza.user.username;
  let userPoints = pointData[user];
  response = response.replace("{{points}}", userPoints);
  response = response.replace("{{user}}", user);

  let date = new Date();
  let current_hour = date.getHours();
  if(current_hour < 10)
    current_hour = "0" + current_hour;

  let current_minutes = date.getMinutes("");
  if(current_minutes < 10)
    current_minutes = "0" + current_minutes;

  response = response.replace("{{time}}", current_hour + ":" + current_minutes);

  let synRegEx = /{{syn:.*}}/g;

  let thingsToSwitch = [];
  let match;

  while((match = synRegEx.exec(response)) !== null)
  {
    let synBaseStr = match[0];
    console.log(synBaseStr);
    let synToReplace = synBaseStr.substring(6, synBaseStr.length - 2);
    console.log(synToReplace);
    console.log(SynonymsDB[synToReplace]);
    let replacement = SynonymsDB[synToReplace][getRandomInt(0, SynonymsDB[synToReplace].length)];
    thingsToSwitch.push(
      {
        base: synBaseStr,
        replacement: replacement
      }
    );
  }

  for(let i = 0; i < thingsToSwitch.length; i++)
    response = response.replace(thingsToSwitch[i].base, thingsToSwitch[i].replacement);

  console.log(thingsToSwitch);

  return response;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
