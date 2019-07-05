// require modules
const express = require("express");
const http = require("http");
const faye = require('faye');
const bodyParser = require('body-parser')
const async = require("async");

// server settings
const app = express();
var server = http.createServer(app);
var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});

bayeux.attach(server);

var faye_client = bayeux.getClient();

global.serverSettings = {
	//host: "https://soccertreff.herokuapp.com",
	host: "https://localhost/",
	port: process.env.PORT || 8080
}
// bodyparser for json being able to read
app.use(bodyParser.json())

// load scripts from all resources
var users = require('./users/index.js');
var fangroups = require('./fangroups/index.js');
var fanevents = require('./fanevents/index.js');
//var teams = require('./teams/index.js');

app.use("/users", users.router);
app.use("/fangroups", fangroups.router);
app.use("/fanevents", fanevents.router);
//app.use("/teams", teams.router);

setInterval(function() {
	for(let i = 0; i < allFanevents.length; i++) {
		if(allFanevents[i].tags.length > 0) {
			for(let j = 0; j < allFanevents[i].tags.length; j++) {
				faye_client.publish('/fanevents/' + allFanevents[i].game + '/' + allFanevents[i].tags[j] , {
					text : 'fanevents reminder !',
					fanevents : allFanevents[i]
				});
			}
		}
	}
}, 10000);

// Load Databases sync
async.waterfall([

	// load fangroups Data
	function(callback) {
		fangroups.loadData(callback);
	},
	// if there is an error quit. else load fanevents Data
	function (err, callback) {
		if(err != null){
			callback(err + " - fangroups", false);
		}
		else {
			fanevents.loadData(callback);
		}
	},
	// if there is an error quit. else load user Data
	function (err, callback){
		if(err != null) {
			callback(err + " - fanevents", false);
		}
		else {
			users.loadData(callback);
		}
	},
	// if there is an error quit.
	function (err, callback){
		if(err != null) {
			callback(err + " - users", false);
		}
		else {
			callback(null, true);
		}
	},
], function(err, success) {
	console.log("Database " + (success? "successfully loaded." : "failed loading. - " + err ));


// Server Start
	server.listen(serverSettings.port, function() {
		console.log("App listening at %s:%s", serverSettings.host, serverSettings.port);
	});
});

// called when server is shut down
function onExit(){

	async.waterfall([
		// saves fangroups Data
		function(callback){
			fangroups.saveData(callback);
		},
		// if there was an error -> quit. else save fanevents
		function (err, callback) {
			if(err != null){
				callback(err + " - fangruppen", false);
			}
			else {
				fanevents.saveData(callback);
			}
		},
		// if there was an error -> quit. else save users
		function (err, callback){
			if(err != null){
				callback(err + " - fanevents", false);
			}
			else {
				users.saveData(callback);
			}
		},
		// if there was an error loading users -> quit
		function (err, callback){
			if(err != null){
				callback(err + " - users", false);
			}
			else {
				callback(null, true);
			}
		},
	], function(err, success) {
		// close server
		console.log("Database " + (success? "successfully saved." : "failed saving. - " + err ));

		console.log("Server Shutdown");
		process.exit();
	});
}

// Server Sutdown
process.on("SIGINT", onExit);
