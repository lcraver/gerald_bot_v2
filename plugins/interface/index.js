'use strict';

const runtime = require('../../utils/Runtime');
const Client = require('../../utils/Client');
const Settings = require('../../utils/Settings');
var express = require('express');
var path = require('path');
var app = express();
var router = express.Router();
var exphbs = require('express-handlebars');

module.exports = [{
	types: ['startup'],
	action: function(chat) {

		let baseURL = __dirname + "\\public";

		app.set('port', process.env.PORT || 3000);
		var options = {
			dotfiles: 'ignore',
			etag: false
		};

		app.use(express.static(baseURL, options));
		app.set('views', baseURL + '/views');
		app.set('view options', { layout: false });

		app.engine('handlebars', exphbs({
			defaultLayout: 'main',
			layoutsDir: baseURL + '/views/layouts',
      partialsDir: baseURL + '/views/partials'
		}));
		app.set('view engine', 'handlebars');

		//exphbs.registerPartial('myPartial', '{{name}}')

		app.get('/script/:file', function(req, res)
		{
			res.sendFile(baseURL + '/scripts/' + req.params.file);
		});

		app.get('/style/:file', function(req, res)
		{
			res.sendFile(baseURL + '/styles/' + req.params.file);
		});

		app.get('/asset/:file', function(req, res)
		{
			res.sendFile(baseURL + '/asset/' + req.params.file);
		});

		app.get('/', function(req, res)
		{
			res.render('home');
		});

		app.get('/users', function(req, res)
		{
			var userData = runtime.brain.get('users') || {};
			var activeUserList = Object.keys(userData);

			var usersToReturn = [];

			for(var i = 0; i < activeUserList.length; i++)
			{
				var tmpUser = activeUserList[i];
				var tmpUserObj = {
					"username": tmpUser,
					"role": userData[tmpUser].role,
					"status": userData[tmpUser].status,
					"last_visit": userData[tmpUser].lastVisitTime
				};
				if(userData[tmpUser].watching && tmpUser != runtime.credentials.username)
					usersToReturn.push(tmpUserObj);
			}

			res.send(usersToReturn);
		});

		app.get('/logs', function(req, res)
		{
			var logs = runtime.brain.get('userMessages') || {};
			var usersInLog = Object.keys(logs);

			let messagesToReturn = [];

			for(var i = 0; i < usersInLog.length; i++)
			{
				let lastMessage = "";
				var tmpUser = usersInLog[i];
				for(var j = 0; j < logs[tmpUser].messages.length; j++)
				{
					let currentMessage = logs[tmpUser].messages[j].message;
					if(currentMessage != "available")
					{
						var tmpMessageObj = {
							"username": tmpUser,
							"username_short": shortenUsername(tmpUser),
							"message": currentMessage,
							"time": logs[tmpUser].messages[j].time,
							"full_time": timeConverter(logs[tmpUser].messages[j].time),
							"display_time": displayTimeConverter(logs[tmpUser].messages[j].time)
						};

						messagesToReturn.push(tmpMessageObj);
					}
					lastMessage = currentMessage;
				}
			}

			res.send(messagesToReturn);
		});

		app.post('/logs', function(req, res)
		{
			res.sendStatus(200);
			runtime.brain.set('userMessages', {});
			console.log("Deleting Logs!");
		});

		app.get('/plugins', function(req, res)
		{
			res.send(runtime.loadedPlugins);
		});

		app.get('/plugins/:pluginToToggle', function(req, res)
		{
			let pluginToToggle = req.params.pluginToToggle;
			let settingValue = Settings.getSetting('plugins', pluginToToggle);
			res.send(settingValue);
		});

		app.post('/plugins/:pluginToToggle', function(req, res)
		{
			let pluginToToggle = req.params.pluginToToggle;
			let settingValue = Settings.getSetting('plugins', pluginToToggle);
			Settings.setSetting('plugins', pluginToToggle, !settingValue);
			for(let i = 0; i < runtime.loadedPlugins.length; i++)
				if(runtime.loadedPlugins[i].pluginName == pluginToToggle)
				{
					runtime.loadedPlugins[i].active = !settingValue;
					break;
				}
			res.sendStatus(200);
		});

		app.get('/commands/:commandType', function(req, res)
		{
			let commands = runtime["coreCommands"][req.params.commandType];
			for(let i = 0; i < commands.length;)
			{
				if(commands[i].name == null || commands[i].name == undefined)
					commands.splice(i, 1);
				else
					i++;
			}
			res.send(commands);
		});

		app.listen(app.get('port'),  function () {
			console.log('Interface started on http://localhost:' +
			app.get('port') + '; press Ctrl-C to terminate.' );
		});
  }
}];

module.exports.appAPI = app;

function shortenUsername(username) {
	if(username.includes(" "))
	{
		let splits = username.split(" ", 2);
		return splits[0].substr(0, 1) + splits[1].substr(0, 1);
	}
	else if(username.includes("_"))
	{
		let splits = username.split("_", 2);
		return splits[0].substr(0, 1) + splits[1].substr(0, 1);
	}
	else if(username.includes("-"))
	{
		let splits = username.split("-", 2);
		return splits[0].substr(0, 1) + splits[1].substr(0, 1);
	}
	else
	{
		return username.substr(0, 2);
	}
}

function timeConverter(time){
	var newDate = new Date();
	newDate.setTime(time);
	return newDate.toLocaleString();
}

function displayTimeConverter(time){
	var newDate = new Date();
	newDate.setTime(time);
	var newDate2 = new Date();
	if(newDate.toLocaleDateString() == newDate2.toLocaleDateString())
		return newDate.toLocaleTimeString();
	else
		return newDate.toLocaleDateString();
}


// ---- Functions to Setup plugin API calls ---- //
