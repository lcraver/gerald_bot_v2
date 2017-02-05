'use strict';

const Say = require('../../utils/Say');
const runtime = require('../../utils/Runtime');
const Client = require('../../utils/Client');
const pluginSettings = require('./settings.json');

module.exports = [{
    types: ['interface'],
  	action: function(api) {

      api.get('/points', function(req, res)
  		{
				let pointData = runtime.brain.get('points') || {};
  			res.send(pointData);
  		});

      api.get('/points/top/:num', function(req, res)
  		{
				let pointData = runtime.brain.get('points') || {};
        let usersInPoints = Object.keys(pointData);

        let pointDataArray = [];

        for(let i = 0; i < usersInPoints.length; i++)
        {
          let user = usersInPoints[i];
          if(user != runtime.credentials.username && user != runtime.credentials.room)
            pointDataArray.push({
              user: user,
              points: pointData[user]
            });
        }

        pointDataArray.sort( function(a, b) {
    			return a.points < b.points ? -1 : a.points > b.points ? 1 : 0;
    		}).reverse();

        if(req.params.num != 0)
  			  res.send(pointDataArray.slice(0,req.params.num));
        else
          res.send(pointDataArray);
  		});

      api.get('/points/:user', function(req, res)
  		{
        let pointData = runtime.brain.get('points') || {};
  			res.send("{" + pointData[req.params.user] + "}");
  		});
    }
  },
	{
	name: '!points',
	help: 'Shows the user their points.',
  types: ['message'],
  regex: /^!points$/,
  action: function( chat, stanza ) {
		//console.log(chat);
		let pointData = runtime.brain.get('points') || {};
		let user = stanza.user.username;
		let userPoints = pointData[user];

		if(pointData != {})
		{
      if(userPoints == undefined || userPoints == null)
        userPoints = 0;
			let message = "@" + user + ": you have " + userPoints;
			if(userPoints == 1)
				message += " point!";
			else
				message += " points!";
	    Say.say(message, "Zira");
			chat.sendMessage(message);
		}
  }
},
{
	types: ['reoccuring'],
	action: function(chat, stanza) {
		// Update User storage in brain
		let pointData = runtime.brain.get('points') || {}; // initialize the points storage
		let userData = runtime.brain.get('users') || {}; // initialize the points storage

		if(pointData != {} && pointData != null)
		{
			let activeUserList = Object.keys(userData);

			for(var i = 0; i < activeUserList.length; i++)
			{
				let tmpUser = activeUserList[i];

				if(userData[tmpUser].watching == true)
				{
					if (tmpUser in pointData)
					{
						let tmpPoints = pointData[tmpUser];
						pointData[tmpUser] = tmpPoints + 1;
					}
					else
					{
						pointData[tmpUser] = 1;
					}
				}
			}

			runtime.brain.set('points', pointData);
		}
		else
		{
			runtime.brain.set('points', {}); // create points storage if none
			console.log("-- Created empty point storage --");
		}

	}
}, {
	types: ['startup'],
	action: function(chat, stanza) {

		console.log(runtime);
    console.log(runtime.plugins);
    console.log(runtime.loadedPlugins);

		let pointData = runtime.brain.get('points') || null; // initialize the points storage

		if(pointData != undefined && pointData != null)
		{
			let userList = Object.keys(pointData);
			var purgeList = [];

			for(var i = 0; i < userList.length; i++)
			{
				let tmpUser = userList[i];
				let tmpPoints = pointData[tmpUser];

				if(tmpPoints <= pluginSettings.minPointPurge)
				{
					purgeList.push(tmpUser);
					delete pointData[tmpUser];
				}
			}

			if(purgeList.length > 0)
			{
				console.log("Purged the following users that had less then ["+pluginSettings.minPointPurge+"] points: " + purgeList);
				runtime.brain.set('points', pointData);
			}
		}
		else
		{
			runtime.brain.set('points', {}); // create points storage if none
			console.log("-- Created empty point storage --");
		}
	}
}];
