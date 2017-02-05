'use strict';

/**
 * This command allows moderators to manage
 * commands via chat instead of via code.
 *
 * Usage:
 *
 * !addcommand COMMAND_NAME OUTPUT
 * !removecommand COMMAND_NAME
 */
const runtime = require('../utils/Runtime');

let addCommandRegex = new RegExp( /^!addcommand\s(\w+)\s(.+)$/ );
let removeCommandRegex = new RegExp( /^!removecommand\s(\w+)$/ );
let runCommandRegex = new RegExp( /^!(.+)$/ );

module.exports = [{
    // List custom commands
    types: ['interface'],
    action: function(api) {

      api.get('/customCommands', function(req, res)
  		{
        let customCommands = runtime.brain.get('customCommands') || {};
        let commandNames = Object.keys(customCommands);

        let returnCommands = [];
        for(let i = 0; i < commandNames.length; i++)
        {
          returnCommands.push({
            name: commandNames[i],
            return: customCommands[commandNames[i]]
          });
        }
  			res.send(returnCommands);
  		});
    }
},
{
  	// Run custom command
    types: ['message'],
    regex: runCommandRegex,
    action: function( chat, stanza ) {
      let customCommands = runtime.brain.get('customCommands') || {};

  		let match = runCommandRegex.exec(stanza.message);
  		let command = match[1];

      console.log("Run custom command! " + match);

  		let commandValue = customCommands[command];
  		if (commandValue) {
  			chat.sendMessage( commandValue );
  		}
    }
},
{
	// Add custom command
	name: '!addcommand {command} {output}',
	help: 'Adds a new command to the bot (Mod only).',
    types: ['message'],
    regex: addCommandRegex,
    action: function( chat, stanza ) {

      //console.log(stanza.user);
      //console.log(stanza.message);

      if (stanza.user.isModerator() || stanza.user.isStreamer()) {

        console.log("Adding command!");

  			let match = addCommandRegex.exec( stanza.message );
        console.log(match);
  			let command = match[1];
  			let commandValue = match[2];
  			let customCommands = runtime.brain.get('customCommands') || {};

  			customCommands[command] = commandValue;
  			runtime.brain.set('customCommands', customCommands);

  			chat.replyTo(stanza.user.username, `~ command !${command} added ~`);
		  }
    }
}, {
	// Remove custom command
	name: '!removecommand {command}',
	help: 'Removes a command from the bot (Mod only).',
    types: ['message'],
    regex: removeCommandRegex,
    action: function( chat, stanza ) {
      if (stanza.user.isModerator() || stanza.user.isStreamer()) {
  			let match = removeCommandRegex.exec(stanza.message);

  			let command = match[1];
  			let customCommands = runtime.brain.get('customCommands') || {};

        // Remove the command from the customCommands object
  			delete customCommands[command];

  			runtime.brain.set( 'customCommands', customCommands );
  			chat.replyTo( stanza.user.username, `~ command !${command} removed ~` );
  		}
    }
}]
