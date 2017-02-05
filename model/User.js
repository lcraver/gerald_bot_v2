'use strict';

const runtime = require('../utils/Runtime');
const Settings = require('../utils/Settings');
const availableStatuses = Settings.getSetting('user-status', 'statuses');

class User {
	constructor(attrs) {
		this.username = attrs.username;
		this.role = attrs.role;
		this.status = attrs.status;
		this.viewCount = attrs.count;
		this.lastVisitTime = attrs.time;
		this.disconnectTime = attrs.disconnectTime;
		this.watching = attrs.watching;
	}

	/**
	 * Save this user into the brain
	 * @return {void}
	 */
	saveToBrain() {
		let users = runtime.brain.get('users') || {};
		users[this.username] = {
			username: this.username,
			count: this.viewCount,
			time: this.lastVisitTime,
			disconnectTime: this.disconnectTime,
			role: this.role,
			status: this.status,
			watching: this.watching
		};
		runtime.brain.set( 'users', users );
	}

	getMessages() {
		let messages = runtime.brain.get('userMessages') || {};
		let userMessageLog = messages[ this.username ];

		return userMessageLog;
	}

	/**
	 * Returns a boolean if the user has equal-to or
	 * greater than the passed-in permission.
	 * @param  {String}  statusID
	 * @return {Boolean
	 */
	hasStatus(statusID) {
		let statusObj = availableStatuses[ statusID.toLowerCase() ];
		let userStatusObj = availableStatuses[ this.status.toLowerCase() ];
		return userStatusObj.weight >= statusObj.weight;
	}

	isModerator() {
		return this.hasStatus('moderator');
	}

	isStreamer() {
		return this.username === runtime.credentials.room;
	}

	isBot() {
		return this.username === runtime.credentials.username;
	}

	isWatching() {
		return this.watching === true;
	}
}

module.exports = User;
