// require modules
const request = require("request");
const fs = require("fs");
const readline = require('readline');
const chalk = require('chalk');
const faye = require('faye');

// settings to connect to server
const settings = {
//host: "https://soccertreff.herokuapp.com",
	host: "http://localhost/",
  port: process.env.PORT || 8080
};

// connect to faye server
const client = new faye.Client(settings.host + "/faye");

// rl for input possability
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

// path to all formats
const dbPath = "/format.json";
const README = "/README.txt";

// editmode: when user makes input -> different functions
// options: request header
// currentObj: current editing body for request
// AllObject: loaded json file for resources
// user: authentificates user
var inEditMode = false;
var options = null;
var currentObj = null;
var AllObjects;
var user = null;

/**************************
 * functions
**************************/
// starts the input for the user
function startInput() {

	console.log("Hello !!!");
	console.log("For information about the input possibilities type 'info'");
	console.log("");
	console.separate();

	//starts the input loop
	rl.on('line', function(input) {

		// check if user is NOT in editmode
		if(!inEditMode) {

			switch (input) {

				// output info for user
				case "info":
					fs.readFile(__dirname + README, 'utf8', function(err, data) {
						console.separate();
						console.log(data);
						console.separate();
					});
					break;
				//only for debug reasons
				case "debug":

					// add everything here to debug the script
					break;
				// fangroup search system
				case "searchGroup":

					// ask user for what team he is looking
					rl.question('what team are you looking for? ', function(team) {
						//TODO:
						// check if team exist
						if(true) {

							// ask user what tags he is looking for
							rl.question('what tags for ' + team + 'are you looking for? ', function(location) {

								// check what tags the user entered
								var tag = tags.split("/");

								// check if tags are empty
								if(tag[0] == ''){
									console.log(chalk.red("Tag list is empty"));
									console.separate();
									return;
								}

								console.log(chalk.blue("looking for already existings fangroups"));

								//GET all groups and check if theres already a matching one
								newRequest("GET", "fangroups");

								sendRequest(function(data) {

									// check all entered tags
									for(var i = 0; i < tag.length; i++){

										//inform about subscriptions
										console.log(chalk.blue('Subscribed for ' + team + '/' + location));

										// subscribe for team
										client.subscribe('/' + team + '/' + location, function(message) {
											console.separate();
											console.log(chalk.blue('Found a fangroup for: ' + team));
											console.log(message.data);
											console.separate();
										});
									}

									for(var i = 0; i < data.length; i++){
										if(data[i].team == team) {
											data[i].tags.forEach(function(element) {
												if(tag.indexOf(element) > -1) {
													console.log(data[i]);
												}
											});
										}
									}
								});
							});
						}
						else {
							console.log("this team doesnt exist");
							return;
						}
					});
					break;
				//login user
				case "login":
					rl.question('userID : ', function(userID) {

						//prevent user send reuqest to all users
						if(userID.length == 0) {
							console.log(chalk.red("invalid user"));
							return;
						}

						var uri = "users/" + userID;
						newRequest("GET", uri);

						sendRequest(function(data) {

							user = data;
							console.separate
							console.log(chalk.green("Logged in as:"));
							outputData(data);

							// Subscribe User for all fanevents types
							if(user.team.length != 0){
								user.team.forEach(function(element){
									if(element.tags.length != 0) {
										element.tags.forEach(function(elem) {
											client.subscribe('/fanevents/' + element.name + '/' + elem, function(message) {
												console.separate();
												console.log(chalk.blue('Incoming Message : ' + message.text));
												console.log(message.event);
												console.separate();
											});
										});
									}
								});
							}
						});
					});
					break;

				// if user types REST verb
				case "PUT":
				case "POST":
				case "GET":
				case "DELETE":

					// ask user what resource he/she wants
					rl.question('what resource? ', function(resource) {

						newRequest(input, resource);

						if(input == "PUT" || input == "POST") {

							newResource(input, resource);
						} else {
							sendRequest(function(data){
								outputData(data);
							});
						}
					});
					break;

				// close the program
				case "exit":
					console.log("Exiting program");
					rl.close();
					break;

				// if user mistypes
				default:
					console.log(chalk.red("invalid input"));
			};
		// if user is in editmode
		} else {

			switch (input) {

				// close editmode and delete the current request
				case "close":
					rl.question("do you really want to close? all changes will be lost (Y/N)", function(closeNote) {
						if(closeNote == "Y" || closeNote == "y"){
							currentObj = null;
							console.log(chalk.red("process canceled"));
							inEditMode = false;
						}
					});

					break;
				// sends the request
				case "send":
					sendRequestWithData(currentObj, function(data){
						outputData(data);
					});
					break;
				// check if user wants to change some values
				default:
					var check = input.split("=");

					// check if user input was correct
					if(check.length == 2) {

						if(check[0] in currentObj) {

							// check if second string is an Object. if true parse it
							if(check[1].charAt(0) == "[" && check[1].charAt(check[1].length - 1) == "]") {

								try {
									check[1] = JSON.parse(check[1]);
								}
								catch(error) {
									console.log(chalk.red.bold("invalid json format"));
									return;
								}
							}

							// update value
							currentObj[check[0]] = check[1];
							console.separate();
							console.log(currentObj);
						}
						else {
							console.log("element doesnt exist");
						}
						break;
					}
					console.log("wrong format or unknown command");
					break;
			};
		};
	});
};

// creates a new resource
// method: REST verb
// resource: name of resource
function newResource(method, resource) {

	if(user == null) {
		console.separate();
		console.log("to make some changes on, you must first login. For the information type 'info'");
		console.separate();
		return;
	}

	// if POST load preset from AllObjects
	if (method == "POST" ) {
		if(resource in AllObjects) {
			currentObj = AllObjects[resource];

			if ('members' in currentObj) {

				var cMem = user.href.split('/');
				currentObj.members.push(cMem[cMem.length - 1]);

			}

			enterEditMode();
		} else {
			console.log("resource doesnt exist or doesnt support POST/PUT");
			console.separate();
			return;
		};
	}
	// if PUT first get the resource from server and update currentObj
	else if (method == "PUT") {

		// if resource have have an invalid form
		if(resource.split("/").length == 1) {
			console.log(chalk.red.bold("resource error"));
			console.separate();
			return;
		}
		options.method = "GET";
		sendRequest(function(data) {

			if(data.href != undefined)
				delete data.href;

			if(data.members != undefined) {

				var ct = 0;

				for(var i = 0; i < data.members.length; i++) {
					var te = data.members[i].split('/');
					data.members[i]	 = te[te.length-1];

					ct++

					if(ct == data.members.length){
						currentObj = data;
					}
				};
			}
			else {
				currentObj = data;
			}
			options.method = "PUT";
			enterEditMode();
		});
	}
}

// enterEditMode
function enterEditMode(){

	console.separate();
	console.log(chalk.blue("Entered Edit mode"));
	console.log(currentObj);
	inEditMode = true;
}

// Sends the request with a body
// data: the body that should be send with request
// callback: requests the response data.
function sendRequestWithData(data, callback){
	options.body = currentObj;
	options.json = true,
	inEditMode = false;
	sendRequest(function(data){
		callback(data);
	});
}

// output Datas
function outputData(data){
	console.log(data);
	console.separate();
	console.separate();
}

// creates the request to the server
// method: is the REST verb
// res: is the path to the resource
// data: body sending on POST or PUT
function newRequest(methodD, res) {

	// request header
	options = {
		uri : settings.host + "/" + res,
		method : methodD,
		headers : {
			"Content-Type" : "application/json"
		}
	};
};

// sends the Request
function sendRequest(callback) {

	request(options, function(err, response) {

		// if request fails -> exit
		console.separate();
		if(err != null){
			console.log(chalk.red("Error" + err));
			rl.close();
			return;
		}
		if(response.statusCode.toString()[0] == 2 ) {
			console.log(chalk.green.bold("Status = " + response.statusCode));
		}
		else{
			console.log(chalk.red("Status = " + response.statusCode));
		}

		if(options.method == "DELETE"){
			return;
		}
		if(response.statusCode.toString()[0] == 4 ){
			console.log(chalk.red("Client Error"));
		}
		else if(response.statusCode.toString()[0] == 5 ){
			console.log(chalk.red("Server Error"));
		}
		else {

			if(options.method == "POST" || options.method == "PUT") {

				// publish the created fangroup
				if(response.client._httpMessage.method == "POST" && response.client._httpMessage.path == "/fangroups"){

					response.body.tags.forEach(function(element){

						client.publish('/'+ response.body.team + '/' + element, {
							data: response.body
						});
					});
				};

				callback(response.body);
			} else {
				var data = JSON.parse(response.body);
				callback(data);
			}
		}
	});
}

// seperate script :)
console.separate = function() {
	console.log(chalk.blue("**********************************************"));
};

// load formats from database
function loadData(callback) {
	fs.readFile(__dirname + dbPath, function(err, data) {
		// saves it global
		AllObjects = JSON.parse(data)[0];
		callback;
	});
}

// MAIN() Start the script
function MAIN (){
	loadData(startInput());
}
MAIN();
