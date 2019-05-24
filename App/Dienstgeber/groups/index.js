// require modules
const express = require("express");
const fs = require("fs");

// set up
const router = express.Router();
const dbPath = "/groups.json";

// saves all groups
var allGroups;
var lastGroupsID;

/*Group creates a new group
* id: automaticly generates unique id
* name: name of the group
* members: list of members in the group
* maxMember: number of max users in group
* team: the team attached to this group
* requirements: string with the requirements
* tags: list with tags to find the group
*/
function Group(name, members, maxMem, team, requ, tags) {
	this.id = lastGroupsID;
	this.name = name;
	this.members = members;
	this.maxMember = maxMem;
	this.team = team;
	this.requirements = requ;
	this.tags = tags;

	lastGroupsID++
}

// returns main information of the group
Group.prototype.info = function() {
	return this.name;
};

/**************************
 * REST API
**************************/
// Creates a new group
router.post('/', function(req, res){
	var group = req.body;

	// check if request is valid
	if(!checkIsValidForm(group)){
		res.sendStatus(406);
	} else {
		//creates new Group and adds it to the List
		var newGroup = new Group(group.name, group.members, group.maxMember, group.team, group.requirements, group.tags);
		allGroups.push(newGroup);

		changeData(newGroup, function(data){

			// send the new group
			res.send(data);
		})
	}
});

// GETs all groups
router.get('/', function(req, res){

	// check if query param is set
	var tag = req.query.tag;

	if(tag == undefined) {
		// if no query param is set send all groups
		var data = [];

		var ct = 0;

		allGroups.forEach(function(element) {
			changeData(element, function(elem){

				data.push(elem);

				ct++;
				if(ct == allGroups.length){
					res.send(data);
				}
			});
		});

	} else {

		// if query param is set search all groups in foreach for the query
		var TagList = [];
		allGroups.forEach(function(element){
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

// GETs one group
router.get('/:groupID', function(req, res) {

	// returns a Group by id
	getGroupById(req.params.groupID, function(group){
		// if group is undefined return 404 else return the group
		if(group == undefined)
			res.sendStatus(404);
		else
			changeData(group, function(data){
				res.send(data);
			})

	});
});

// PUTs new information into existing resource
router.put('/:groupID', function(req, res) {

	// checks if req is a valid form
	var info = req.body;
	if(!checkIsValidForm(info)){
		res.sendStatus(406);
	}
	else {
		// gets the group
		getGroupById(req.params.groupID, function(group){

			// if group doesnt exist return 404 and stops the script
			if(group == undefined){
				res.send(404);
				return;
			}

			// else update all stats
			group.name = info.name;
			group.team = info.team;
			group.members = info.members;
			group.maxMember = info.maxMember;
			group.requirements = info.requirements;
			group.tags = info.tags;

			changeData(group, function(data){

				// send the new group
				res.send(data);
			});
		});
	}
});

// DELETEs a resource
router.delete('/:groupID', function(req, res) {

	// returns a group by id
	getGroupById(req.params.groupID, function(obj){

		// if the group doesnt exist return 404 and stops the script
		if(obj == undefined) {
			res.sendStatus(404);
			return;
		}

		// gets the index in the List of an Object
		var index = allGroups.indexOf(obj);
		if (index > -1) {
		// deletes the group and return 200
			allGroups.splice(index, 1);
			res.sendStatus(200);
		};
	});
});

/**************************
 * Functions
**************************/

// return: id of the team
function getGroupById(id, callback) {
	allGroups.find(function(element){
		if(element.id == id){
			callback(element);
		}
	});
}

// checks if the form of a group is valid
function checkIsValidForm(data) {

	var stat = true;

	if(data == undefined)
		stat = false;

//checks if any data is empty
	if(	data.name != undefined &&
		data.team != undefined &&
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

	element.href = serverSettings.host + "/groups/" + element.id;
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
				allGroups = [];
				lastGroupsID = 0;
			}
			// else parse JSON and save into allGroups
			else {
				var parseInfo = JSON.parse(data);
				allGroups = parseInfo.data;
				lastGroupsID = parseInfo.lastGroupsID;
			}
			// calls callback
			callback(null, err);
		})
	},

	// save Database
	// param: callback for async.waterfall
	saveData : function (callback) {

		//saves allGroups into File and calls callback
		var saveObj = {};
		saveObj.data = allGroups;
		saveObj.lastGroupsID = lastGroupsID;
		fs.writeFile(__dirname + dbPath, JSON.stringify(saveObj), function(err){
			callback(null, err);
		});
	}
}
