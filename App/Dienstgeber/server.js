// require modules
const express = require('express');
const http = require('http');
const faye = require('faye');
const bodyParser = require('body-parser');


// server wird gesettet
const app = express();
var server = http.createServer(app);
var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});

bayeux.attach(server);

global.serverSettings = {
    port: process.env.PORT || 8080
}

// body Parser for JSON
app.use(bodyParse.json())

// load resources
var user = require('./user/index.js');
var groups = require('./groups/index.js');
var events = require('./events/index.js');
var teams = require('./teams/index.js');

app.use('/user' user.router);
app.use('/groups' groups.router);
app.use('/events' events.router);
app.use('/teams' teams.router);


app.get("/", function(req, res){
  res.send("Hello World");
});
// Server hört zu
server.listen(serverSettings.port, function(){
  console.log("Server gestarten auf %s", serverSettings.port);
});

// Server Shutdown
process.on('SIGINT', onExit);
