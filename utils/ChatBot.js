'use strict';

const Client = require( './Client' );
const Websocket = require('./Websocket');
const Log = require('./Log');
const Loader = require('./Loader');
const Settings = require('./Settings');
let runtime = require('./Runtime');

class ChatBot {
	static start() {
		// Load core commands
		Loader.loadCoreCommands((coreCommands) => {
			// coreCommands is returned as an object with
			// each message type as an array
			runtime.coreCommands = coreCommands;

			// Load plugin commands
			Loader.loadPluginCommands((pluginCommands, pluginWebsocketFiles) => {
				runtime.pluginCommands = pluginCommands;
				runtime.pluginWebsocketFiles = pluginWebsocketFiles;

				// Load the client (connects to server)
				let chat = new Client(runtime.credentials);
				let api = require('../plugins/interface/index').appAPI;

				let users = runtime.brain.get('users') || {};
				let userList = Object.keys(users);

				for(let i = 0; i < userList.length; i++)
					users[userList[i]].watching = false;

				runtime.brain.set('users', users);

				// Run any start up commands
				ChatBot.runStartupCommands(chat);
				ChatBot.runInterfaceCommands(api);

				// Run any start up commands
				ChatBot.startUpdateLoop(chat);

				// Start the websocket server
				Websocket.start(chat);

				// Start listening for stanzas
				ChatBot.listenForStanzas(chat);
			});
		});
	}

	static startUpdateLoop(chat) {

		var loop = function updateLoop() {
			console.log("-- Update Tick --");

			// Loop through each startup core commands, and run the action
			runtime.coreCommands.reoccuring.forEach(function(command) {
				command.action(chat);
			});

			// Loop through each startup plugin commands, and run the action
			runtime.pluginCommands.reoccuring.forEach(function(command) {
				command.action(chat);
			});

			let commandCycle = Settings.getSetting('coreApp', 'app_cycle');
			setTimeout(loop, commandCycle*1000);
		}

		loop();
	}



	/**
	 * Run any of the 'startup' type commands
	 * for both core and plugin commands.
	 * @return {void}
	 */
	static runStartupCommands(chat) {
		// Loop through each startup core commands, and run the action
		runtime.coreCommands.startup.forEach(function(command) {
			command.action(chat);
		});

		// Loop through each startup plugin commands, and run the action
		runtime.pluginCommands.startup.forEach(function(command) {
			command.action(chat);
		});
	}

	/**
	 * Run any of the 'interface' type commands
	 * for both core and plugin commands.
	 * @return {void}
	 */
	static runInterfaceCommands(api) {
		// Loop through each startup core commands, and run the action
		runtime.coreCommands.interface.forEach(function(command) {
			command.action(api);
		});

		// Loop through each startup plugin commands, and run the action
		runtime.pluginCommands.interface.forEach(function(command) {
			command.action(api);
		});
	}

	/**
	 * Listen for incoming stanzas and run
	 * matching commands.
	 * @param  {Client} chat
	 * @return {void}
	 */
	static listenForStanzas( chat ) {
		// Listen for incoming stanzas
		chat.listen( function( stanza ) {
			// Skip the initial messages when starting the bot
			if ( ChatBot.isStartingUp() ) {
				return;
			}

    	runtime.brain.start( __dirname + '/../brain' );

      // Grab the incoming stanza, and parse it
			let parsedStanza = Client.parseStanza( stanza, runtime.credentials );
			if ( !parsedStanza ) {
				return;
			}
			parsedStanza.ranCommand = false;

			// Run the incoming stanza against
			// the core commands for the stanza's type.
			let coreCommandsForStanzaType = runtime.coreCommands[ parsedStanza.type ];
			if ( coreCommandsForStanzaType ) {
				coreCommandsForStanzaType.forEach( ( command ) => {
					if ( ChatBot.runCommand( command, parsedStanza, chat ) ) {
						parsedStanza.ranCommand = true;
					}
				} );
			}

			// Run the incoming stanza against
			// the plugin commands for the stanza's type.
			let pluginCommandsForStanzaType = runtime.pluginCommands[ parsedStanza.type ];
			if ( pluginCommandsForStanzaType ) {
				pluginCommandsForStanzaType.forEach( ( command ) => {
					if ( ChatBot.runCommand( command, parsedStanza, chat ) ) {
						parsedStanza.ranCommand = true;
					}
				} );
			}

			// Update the user's message log
      Client.updateMessageLog(parsedStanza);

      Log.log(JSON.stringify(parsedStanza, null, 4));
		});
	}

	/**
	 * Runs a passed-in command, if the regex matches
	 * and the rateLimiting criteria matches.
	 * @param  {obj} command
	 * @param  {obj} parsedStanza
	 * @param  {Client} chat
	 * @return {void}
	 */
	static runCommand(command, parsedStanza, chat) {

		try {
			var regexMatched =  command.regex && command.regex.test( parsedStanza.message.toLowerCase() );
			var ignoreRateLimiting = command.ignoreRateLimiting;
			var passesRateLimiting = !parsedStanza.rateLimited || ( parsedStanza.rateLimited && ignoreRateLimiting );

			if ( regexMatched && passesRateLimiting ) {
				command.action( chat, parsedStanza );

				// If we are ignoring rate limiting,
				// don't say we ran a command.
				if ( !ignoreRateLimiting ) {
 					return true;
				}
			}
		} catch ( e ) {
			Log.log( 'Command error: ', command, e );
		}
	}

	/**
	 * Returns a boolean based on the startup state of the bot.
	 * @return {Boolean}
	 */
	static isStartingUp() {
		const messageTime = new Date().getTime();
		if ( messageTime - runtime.startUpTime < 10000 ) { // 10 seconds
			return true; // Skip the messages before the bot was started
		}

		return false;
	}
}

module.exports = ChatBot;
