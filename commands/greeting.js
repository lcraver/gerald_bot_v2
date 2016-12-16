'use strict';

/**
 * Greets a viewer when they join the stream.
 * There is a different message displayed for new viewers vs. previous viewers.
 */

const runtime = require('../utils/Runtime');
const Settings = require('../utils/Settings');
const Templater = require('../utils/Templater');

/**
 * Checks the settings files for greetings, for the passed-in viewerType
 * @param  {String} viewerType
 * @param  {String} status
 * @return {array}
 */
function findAvailableGreetings( viewerType, status ) {
	let greetingsForViewerType = Settings.getSetting( __filename, viewerType );

	// If the user is new, return the 'new' greetings
	if ( viewerType === 'new' ) {
		return greetingsForViewerType;
	} else {
		// User is existing
		if ( greetingsForViewerType && greetingsForViewerType[status] !== undefined ) {
			// Greeting for the user's status exists
			return greetingsForViewerType[status];
		} else {
			// Greeting for the user's status does not exist,
			// return greetings for the first status
			let firstExistingStatus = Object.keys( greetingsForViewerType )[0];
			return greetingsForViewerType[ firstExistingStatus ];
		}
	}
}

/**
 * Returns a random greeting from the
 * available greetings passed-in.
 * @param  {array} availableGreetings
 * @return {string}
 */
function getRandomGreeting( availableGreetings ) {
	if ( !availableGreetings ) {
		return Settings.getSetting( __filename, 'defaultGreeting' );
	}

	let index = Math.floor(Math.random() * availableGreetings.length);
	return availableGreetings[ index ];
};

module.exports = [{
	types: ['presence'],
	regex: /^available$/,
	action: function( chat, stanza ) {
    if ( stanza.user.isStreamer() || stanza.user.isBot() ) {
        return; // Don't greet the streamer or the bot
    }

		let viewerType = stanza.user.viewCount > 1 ? 'existing' : 'new';
		let availableGreetings = findAvailableGreetings( viewerType, stanza.user.status );
		let greeting = getRandomGreeting( availableGreetings );

    greeting = Templater.run( greeting, {
        username: stanza.user.username,
        status: stanza.user.status
    } );

		chat.replyTo( stanza.user.username, greeting );
  }
}];
