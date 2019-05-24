const   express = require('express'),
        fs = require('fs'),
        request = require('request');

const   router = express.Router(),
        dbPath = "/users.json";

		  global.allUsers;
var		lastUserId;

/****************************
 * Object
 ****************************/
function User(name, nachname, username, team) {
    this.id = lastUserId;
    this.name = name;
    this.nachname = nachname;
    this.username = username;
    this.team = team;

    lastUserId++;
}

 User.prototype.info = function() {
     return this.username;
 }

 /****************************
 * REST API
 ****************************/

router.post('/', function(req, res){
    var user = req.body;

    if(!checkIsValidForm(user)) {
        res.sendStatus(406);
    } else {
        var newUser = new User(user.name, user.nachname, user.username, user.team);
        allUsers.push(newUser);

		changeData(newUser, function(data){
			res.send(data);
		});
    }
 });

 router.get('/', function(req, res) {

	var data = [];

	var ct = 0;

	allUsers.forEach(function(element) {
		changeData(element, function(elem){

			data.push(elem);

			ct++;
			if(ct == allUsers.length){
				res.send(data);
			}
		});
	});
});

 router.get('/:userID', function(req, res) {

	getUserById(req.params.userID, function(user){
		if (user == undefined) {
			res.status(404).type('text').send("Der User mit der ID " + req.params.userID + " wurde nicht gefunden.");
		} else {
			changeData(user, function(data){
				res.status(200).type('json').send(data);
			})
		}
	});
 });

 router.put('/:userID', function(req, res) {


	var info = req.body;

    if(!checkIsValidForm(info)) {
        res.sendStatus(406);
    } else {
        var user = getUserById(req.params.userID, function(user) {
            if(user == undefined) {
                res.send(404);
                return;
            } else {
                user.name = info.name;
                user.nachname = info.nachname;
                user.username = info.username;
                user.team = info.team;

				changeData(user, function(data){
					res.send(data);
				});
            }
        });
    }
 });

 router.delete('/:userID', function(req, res) {

    getUserById(req.params.userID, function(obj) {
        if(obj == undefined) {
            res.sendStatus(404);
            return;
        }

        var index = allUsers.indexOf(obj);
        if (index > -1) {
			allUsers.splice(index, 1);
            res.sendStatus(200);
        }
    });


});


 /****************************
 * Functions
 ****************************/

 function getUserById(id, callback) {
    allUsers.find(function(element) {

		if(element.id == id){
			callback(element);
			return;
		}
     });
 };

function checkIsValidForm(data) {

	if(data == undefined)
		return false;
	if(data.name != undefined && data.nachname != undefined && data.username != undefined) {

		if (data.team.length == 0) {
			return true;
		} else {
			data.team.forEach (function(element) {
				//console.log(element);
			});
		}
		return true;
	} else {
		return false;
	}
}

// chenges the data to send to the user
// hides the ids and creates a hypermedia href
function changeData(data, callback) {

	var element = JSON.parse(JSON.stringify(data));

	element.href = serverSettings.host + "/users/" + element.id;
	delete element.id;

	callback(element);
}

 /****************************
 * Exports
 ****************************/

module.exports = {
    router: router,

    loadData : function(callback) {
        fs.readFile(__dirname + dbPath, function(err, data){

            if(data.length == 0) {
                console.log("file was empty");
                allUsers = [];
                lastUserId = 0;
            }
            else {
                var parseInfo = JSON.parse(data);
				allUsers = parseInfo.data;
                lastUserId = parseInfo.lastUserId;
            }

            callback(null, err);
        });
    },

    saveData : function(callback) {
        var saveObj = {};
        saveObj.data = allUsers;
        saveObj.lastUserId = lastUserId;
        fs.writeFile(__dirname + dbPath, JSON.stringify(saveObj), function(err) {
            callback(null, err);
        });
    }

}
