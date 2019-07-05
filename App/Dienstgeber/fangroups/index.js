// require modules
const express = require("express")
const fs = require("fs")

// set up
const router = express.Router()
const dbPath = "/fangroups.json";

// saves all grou
var allFangroups;
var lastFangroupsID;

/*fangroup creates a new angroup
* id: automaticly generates unique id
* name: name of the fangroup
* members: list of members in the fangroup
* maxMember: number of max users in fangroup
* team: the team attached to this fangroup
* location: the location of the fangroup
* requirements: string with the requirements
* tags: list with tags to find the fangroup
*/
function Fangroup(name, members, maxMem, location, team, requ, tags) {
	this.id = lastFangroupsID;
	this.name = name;
	this.members = members;
	this.maxMember = maxMem;
	this.team = team;
	this.location = location;
	this.requirements = requ;
	this.tags = tags;

	lastFangroupsID++
}

// returns main information of the fangroup
Fangroup.prototype.info = function() {
	return this.name;
};

/**************************
 * REST API
**************************/
// Creates a new fangroup
router.post('/', function(req, res){
	var fangroup = req.body;

	// check if request is valid
	if(!checkIsValidForm(fangroup)){
		res.sendStatus(406);
	} else {
		//creates new fangroup and adds it to the List
		var newFangroup = new Fangroup(fangroup.name, fangroup.members, fangroup.maxMember, fangroup.team, fangroup.location, fangroup.requirements, fangroup.tags);
		allFangroups.push(newFangroup);

		changeData(newFangroup, function(data){

			// send the new fangroup
			res.send(data);
		})
	}
});

// GETs all fangroups
router.get('/', function(req, res){

	// check if query param is set
	var tag = req.query.tag;

	if(tag == undefined) {
		// if no query param is set send all fangroups
		var data = [];

		var ct = 0;

		allFangroups.forEach(function(element) {
			changeData(element, function(elem){

				data.push(elem);

				ct++;
				if(ct == allFangroups.length){
					res.send(data);
				}
			});
		});

	} else {

		// if query param is set search all fangroups in foreach for the query
		var TagList = [];
		allFangroups.forEach(function(element){
			element.tags.forEach(function(elem){
				if(elem == tag){

					// adds it to TagList and returns
					TagList.push(element);
					return;
				}
			});
		});
		// if none were found return 404
		if(TagList.length == 0){
			res.sendStatus(404);
		} else
		// else send TagList
			res.send(TagList);
	}
});

// GETs one fangroup
router.get('/:fangroupID', function(req, res) {

	// returns a fangroup by id
	getFangroupById(req.params.fangroupID, function(fangroup){
		// if fangroup is undefined return 404 else return the fangroup
		if(fangroup == undefined)
			res.sendStatus(404);
		else
			changeData(fangroup, function(data){
				res.send(data);
			})

	});
});

// PUTs new information into existing resource
router.put('/:fangroupID', function(req, res) {

	// checks if req is a valid form
	var info = req.body;
	if(!checkIsValidForm(info)){
		res.sendStatus(406);
	}
	else {
		// gets the fangroup
		getFangroupById(req.params.fangroupID, function(fangroup){

			// if fangroup doesnt exist return 404 and stops the script
			if(fangroup == undefined){
				res.send(404);
				return;
			}

			// else update all stats
			fangroup.name = info.name;
			fangroup.team = info.team;
			fangroup.location = info.location;
			fangroup.members = info.members;
			fangroup.maxMember = info.maxMember;
			fangroup.requirements = info.requirements;
			fangroup.tags = info.tags;

			changeData(fangroup, function(data){

				// send the new fangroup
				res.send(data);
			});
		});
	}
});

// DELETEs a resource
router.delete('/:fangroupID', function(req, res) {

	// returns a fangroup by id
	getFangroupById(req.params.fangroupID, function(obj){

		// if the fangroup doesnt exist return 404 and stops the script
		if(obj == undefined) {
			res.sendStatus(404);
			return;
		}

		// gets the index in the List of an Object
		var index = allFangroups.indexOf(obj);
		if (index > -1) {
		// deletes the fangroup and return 200
			allFangroups.splice(index, 1);
			res.sendStatus(200);
		};
	});
});

/**************************
 * Functions
**************************/

// return: id of the team
function getFangroupById(id, callback) {
	allFangroups.find(function(element){
		if(element.id == id){
			callback(element);
		}
	});
}

// checks if the form of a fangroup is valid
function checkIsValidForm(data) {

	var stat = true;

	if(data == undefined)
		stat = false;

//checks if any data is empty
	if(	data.name != undefined &&
		data.team != undefined &&
		data.location != undefined &&
		data.requirements != undefined)
	{
		if(data.members.length == 0)
			stat = false;

		data.members.forEach( function(element) {
			if(!global.allUsers.some(e => e.id == element)) {
				stat = false;
			}
		});
	}
	return stat;
}

// chenges the data to send to the user
// hides the ids and creates a hypermedia href
function changeData(data, callback) {

	var element = JSON.parse(JSON.stringify(data));

	element.href = serverSettings.host + "/fangroups/" + element.id;
	delete element.id;

	for(var i = 0; i < element.members.length; i++){
		element.members[i] = serverSettings.host + "/users/" + element.members[i];

		if(i == element.members.length -1){
			callback(element);
		}
	}
}
/**************************
 * export
**************************/

// module exports into server.js file
module.exports = {

	// exports router for REST
	router: router,

	// load Database
	// param: callback for async.waterfall
	loadData : function (callback) {

		// read data from json file
		fs.readFile(__dirname + dbPath, function(err, data){

			//if the file is empty create empty Array
			if(data.length == 0){
				console.log("file was empty");
				allFangroups = [];
				lastFangroupsID = 0;
			}
			// else parse JSON and save into allFangroups
			else {
				var parseInfo = JSON.parse(data);
				allFangroups = parseInfo.data;
				lastFangroupsID = parseInfo.lastFangroupsID;
			}
			// calls callback
			callback(null, err);
		})
	},

	// save Database
	// param: callback for async.waterfall
	saveData : function (callback) {

		//saves allFangroups into File and calls callback
		var saveObj = {};
		saveObj.data = allFangroups;
		saveObj.lastfangroupsID = lastFangroupsID;
		fs.writeFile(__dirname + dbPath, JSON.stringify(saveObj), function(err){
			callback(null, err);
		});
	}
}
