const   express = require('express'),
        fs = require('fs');

// setup
const router = express.Router();
const dbPath = "/fanevents.json";

// global variables
    global.allFanevents;
var lastFaneventId;

/** constructor for fanevents
 * id: generates unique id for each object automatically
 * name: name of the fanevent
 * members: list of members participating in this fanevent
 * maxMem: maximum number of users who can participate in this fanevent
 * team: team for which the fanevent is created
 * location: location for meet 
 * requ: requirements (string) for joining this fanevent
 * tags: list of tags (strings) related to this fanevent
*/
function Fanevent(name, date, members, maxMem, team, location,requ, tags) {
    this.id = lastfaneventId;
    this.name = name;
    this.date = new Date().toJSON();
    this.members = members;
    this.maxMem = maxMem;
    this.team = team;
    this.location = location;
    this.requirements = requ;
    this.tags = tags;

    lastFaneventId++;
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

 // creates a new fanevent
 router.post('/', function(req, res) {
    var fanevent = req.body;

    // check if request is valid
    if(!checkIsValidForm(fanevent)) {
        res.sendStatus(406);
    } else {
        // creates a new fanevent
        var newFanevent = new Fanevent(fanevent.name, fanevent.date, fanevent.members, fanevent.maxMem, fanevent.team, fanevent.location, fanevent.requirements, fanevent.tags);
        allFanevents.push(newFanevent);

        // adds created fanevent to the associated JSON file
        changeData(newFanevent, function(data){
			res.send(data);
        });

	}
 });

 // gets a list of all fanevents
 router.get('/', function(req, res) {

    // check if query parameter is set
    var tag = req.query.tag;

    if(tag == undefined) {
        // if no query parameter is set send all fanevents
		var data = [];

        //set counter
		var ct = 0;

        // go through all fanevents and change representation of the resource
        allFanevents.forEach(function(element) {
            changeData(element, function(elem) {
                data.push(elem);
                ct++;
                if(ct == allFanevents.length) {
                    res.send(data);
                }
            });
        });

    } else {
        // if query parameter is set search all fanevents for the set query
        var tagList = [];
        allFanevents.forEach(function(element) {
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

 // gets a specific fanevent...
 router.get('/:faneventID', function(req, res) {

    // ... by its id
     getFaneventById(req.params.faneventID, function(fanevent) {
         // in case the requested fanevent is undefined return 404 error...
        if (fanevent == undefined) {
            res.sendStatus(404);
        }
        // ... otherwise send fanevent
        else {
            changeData(fanevent, function(data){
                res.send(data);
            });
        }
     });
 });

 // update information for a specific fanevent
 router.put('/:faneventID', function(req, res) {
    var info = req.body;

    // check if request contains valid data
    if (!checkIsValidForm(info)) {
        // if request is invalid send 406 error
        res.sendStatus(406);
    } else {
        // gets requested fanevent when form is valid
        getfaneventById(req.params.faneventID, function(fanevent) {
                // if fanevent does not exist return 404 error
            if (fanevent == undefined) {
                res.sendStatus(404);
                return;
            }

            // if everything is in order, update the data
            fanevent.name = info.name;
            fanevent.members = info.members;
            fanevent.maxMember = info.maxMem;
            fanevent.team = info.team;
            fanevent.location = info.location;
            fanevent.requirements = info.requirements;
            fanevent.tags = info.tags;

            changeData(fanevent, function(data){

                // send the new fanevent
                res.send(data);
            });
        });
    }
 });

 // removes an item from the fanevents list
 router.delete('/:faneventID', function(req, res) {

    // gets a specific fanevent
    getFaneventById(req.params.faneventID, function(obj){

        // if the requested fanevent does not exist return 404 error
        if (obj == undefined) {
            res.sendStatus(404);
            return;
        }

        // gets the index of the object list
        var index = allFanevents.indexOf(obj);

        // removes the fanevent and return 200 message
        if (index > -1) {
            allFanevents.splice(index, 1);
            res.sendStatus(200);
        };
    });
 });


/****************************
 *        Functions         *
 ****************************/

 // return id of requested fanevent
 function getFaneventById(id, callback) {
     allFanevents.find(function(element) {
         if(element.id == id) {
             callback(element)
         }
     });

 }

 // check if form of an fanevent is acceptable
 function checkIsValidForm(data) {

    var stat = true;

     if (data == undefined) {
         stat = false;
     }

     // check if given data is empty
     if (   data.name != undefined &&
            data.team != undefined &&
            data.location != undefined &&
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


 // changes the data to send to the user
// hides the ids and creates a hypermedia href
function changeData(data, callback) {

	var element = JSON.parse(JSON.stringify(data));

	element.href = serverSettings.host + "/fanevents/" + element.id;
	delete element.id;
    if(element.members && element.members.length <= 0 || element.members == null) {
		//console.log("No members are attending this fanevent yet.");
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
                allFanevents = [];
                lastFaneventId = 0;
            }
            // if file contains data then parse JSON file and save into allfanevents variable
            else {
                var parseInfo = JSON.parse(data);
                allFanevents = parseInfo.data;
                lastFaneventId = parseInfo.lastFaneventId;
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

        // saves data from allfanevents variable to related JSON file
         var saveObj = {};
         saveObj.data = allFanevents;
         saveObj.lastFaneventId = lastFaneventId;
         fs.writeFile(__dirname + dbPath, JSON.stringify(saveObj), function(err) {

            // calls callback
            callback(null, err);
         });
     }

 }
