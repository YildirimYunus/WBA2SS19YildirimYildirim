const   express = require('express'),
        fs = require('fs');

// setup
const router = express.Router();
const dbPath = "/events.json";

// global variables
    global.allEvents;
var lastEventId;

/** constructor for events
 * id: generates unique id for each object automatically
 * name: name of the event
 * members: list of members participating in this event
 * maxMem: maximum number of users who can participate in this event
 * team: team for which the event is created
 * requ: requirements (string) for joining this event
 * tags: list of tags (strings) related to this event
*/
function Event(name, date, members, maxMem, team, requ, tags) {
    this.id = lastEventId;
    this.name = name;
    this.date = new Date().toJSON();
    //this.date = today.setDate(today.getDate());
    this.members = members;
    this.maxMem = maxMem;
    this.team = team;
    this.requirements = requ;
    this.tags = tags;

    lastEventId++;
}

testDate();

function testDate() {
    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var day = now.getDay();
    var jsonNow = now.toJSON();
}

 /****************************
 *        REST API          *
 ****************************/

 // creates a new event
 router.post('/', function(req, res) {
    var event = req.body;

    // check if request is valid
    if(!checkIsValidForm(event)) {
        res.sendStatus(406);
    } else {
        // creates a new event
        var newEvent = new Event(event.name, event.date, event.members, event.maxMem, event.team, event.requirements, event.tags);
        allEvents.push(newEvent);

        // adds created event to the associated JSON file
        changeData(newEvent, function(data){
			res.send(data);
        });

	}
 });

 // gets a list of all events
 router.get('/', function(req, res) {

    // check if query parameter is set
    var tag = req.query.tag;

    if(tag == undefined) {
        // if no query parameter is set send all events
		var data = [];

        //set counter
		var ct = 0;

        // go through all events and change representation of the resource
        allEvents.forEach(function(element) {
            changeData(element, function(elem) {
                data.push(elem);
                ct++;
                if(ct == allEvents.length) {
                    res.send(data);
                }
            });
        });

    } else {
        // if query parameter is set search all events for the set query
        var tagList = [];
        allEvents.forEach(function(element) {
            element.tags.forEach(function(elem) {
                if (elem == tag) {
                    // adds element to taglist and return it afterwards
                    tagList.push(element);
                    return;
                }
            });
        });

        // if element was not found return error 404
        if (tagList.length == 0) {
            res.sendStatus(404);
        }
        // if element was found send taglist
        else {
            res.send(tagList);
        }
    }
 });

 // gets a specific event...
 router.get('/:eventID', function(req, res) {

    // ... by its id
     getEventById(req.params.eventID, function(event) {
         // in case the requested event is undefined return 404 error...
        if (event == undefined) {
            res.sendStatus(404);
        }
        // ... otherwise send event
        else {
            changeData(event, function(data){
                res.send(data);
            });
        }
     });
 });

 // update information for a specific event
 router.put('/:eventID', function(req, res) {
    var info = req.body;

    // check if request contains valid data
    if (!checkIsValidForm(info)) {
        // if request is invalid send 406 error
        res.sendStatus(406);
    } else {
        // gets requested event when form is valid
        getEventById(req.params.eventID, function(event) {
                // if event does not exist return 404 error
            if (event == undefined) {
                res.sendStatus(404);
                return;
            }

            // if everything is in order, update the data
            event.name = info.name;
            event.members = info.members;
            event.maxMember = info.maxMem;
            event.team = info.team;
            event.requirements = info.requirements;
            event.tags = info.tags;

            changeData(event, function(data){

                // send the new event
                res.send(data);
            });
        });
    }
 });

 // removes an item from the events list
 router.delete('/:eventID', function(req, res) {

    // gets a specific event
    getEventById(req.params.eventID, function(obj){

        // if the requested event does not exist return 404 error
        if (obj == undefined) {
            res.sendStatus(404);
            return;
        }

        // gets the index of the object list
        var index = allEvents.indexOf(obj);

        // removes the event and return 200 message
        if (index > -1) {
            allEvents.splice(index, 1);
            res.sendStatus(200);
        };
    });
 });


/****************************
 *        Functions         *
 ****************************/

 // return id of requested event
 function getEventById(id, callback) {
     allEvents.find(function(element) {
         if(element.id == id) {
             callback(element)
         }
     });
     /*return allEvents.find(function(element) {
        return element.id == id;
     });*/
 }

 // check if form of an event is acceptable
 function checkIsValidForm(data) {

    var stat = true;

     if (data == undefined) {
         stat = false;
     }

     // check if given data is empty
     if (   data.name != undefined &&
            data.team != undefined &&
            data.requirements != undefined
        )
        {
            if(data.members.length == 0)
                stat = false;

            data.members.forEach(function(element) {
                if(!global.allUsers.some(e => e.id == element)) {
                    stat = false;
                }
            });
        }
        return stat;

 }

 /*//attempt to check for existing users does not work yet...
hasUser = function (eventMember) {
    //global.allUsers.find(user => user.id === eventMember.id)
    if (eventMember in global.allUsers)
        // If the for loop ended and it did not find any match, return false
            return true;

 }*/

 // changes the data to send to the user
// hides the ids and creates a hypermedia href
function changeData(data, callback) {

	var element = JSON.parse(JSON.stringify(data));

	element.href = serverSettings.host + "/events/" + element.id;
	delete element.id;
    if(element.members && element.members.length <= 0 || element.members == null) {
		//console.log("No members are attending this event yet.");
		callback(element);
    } else {
        for(var i = 0; i < element.members.length; i++){
            element.members[i] = serverSettings.host + "/users/" + element.members[i];

            if(i == element.members.length -1){
				callback(element);
            }
        }
    }

}


  /****************************
 * Exports
 ****************************/

 // exports module to server
 module.exports = {

    // exports router
     router: router,

     /**
      * load database
      * param: callback for async.waterfall
      */
     loadData : function (callback) {

         // read data from JSON file
         fs.readFile(__dirname + dbPath, function(err, data) {

            // if the file does not contain any data create an empty array
            if (data.length == 0) {
                console.log("empty file");
                allEvents = [];
                lastEventId = 0;
            }
            // if file contains data then parse JSON file and save into allEvents variable
            else {
                var parseInfo = JSON.parse(data);
                allEvents = parseInfo.data;
                lastEventId = parseInfo.lastEventId;
            }

            // calls callback
            callback(null, err);
         });
     },

     /**
      * save database
      * param: callback for async.waterfall
      */
     saveData : function (callback) {

        // saves data from allEvents variable to related JSON file
         var saveObj = {};
         saveObj.data = allEvents;
         saveObj.lastEventId = lastEventId;
         fs.writeFile(__dirname + dbPath, JSON.stringify(saveObj), function(err) {

            // calls callback
            callback(null, err);
         });
     }

 }
