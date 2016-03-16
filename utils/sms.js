// var db  = require("../server/db");
var Promise = require("bluebird");

module.exports = {

	clean_from_val: function (from) {
		if (from) {
			from.replace(/\D+/g, "");
			if (from.length == 10) {
				from = "1" + from;
			}

			if (from.length == 11) {
				return from;
			} else {
				return null;
			}

		} else {
			return null;
		}
	},
	
	get_or_create_comm_device: function (from) {
		return new Promise (function (fulfill, reject) {
		  // acquire commid
		  db("comms").where("value", from).limit(1)
		  .then(function (comm) {
		  	
		  	// return list of comms
		  	if (comm.length > 0) {
		  		fulfill(comm);

		  	// create and return a comm
		  	} else {
					var today = new Date(Date.now()).toISOString().split("T")[0];
					var description = "Unknown device (created " + today + ")";

				  db("comms")
				  .returning("commid")
				  .insert({
				  	"type": "cell",
				  	"value": from,
				  	"description": description
				  }).then(function (commid) {
						fulfill(commid);
				  }).catch(function (err) {
					  reject(err);
					});
		  	}

		  }).catch(function (err) {
			  reject(err);
			});
		});
	},
	
	get_clients: function (commid) {
    return new Promise (function (fulfill, reject) {
	    db("clients")
	    .innerJoin("commconns", "commconns.client", "clients.clid")
	    .innerJoin("comms", "commconns.comm", "comms.commid")
	    .whereNull("commconns.retired")
	    .andWhere("commconns.comm", commid)
	    .pluck("clients.clid")
	    .then(function (clients) {
	    	if (clients.length == 0) {
	    		clients = [null];
	    	}
	    	fulfill(clients);
	    }).catch(function (err) {
			  reject(err);
			});
		});
	},
	
	get_or_create_convos: function (clients) {
    return new Promise (function (fulfill, reject) {
	    db("convos")
	    .whereIn("client", clients)
	    .andWhere("convos.open", true)
	    .then(function (convos) {

	    	// there are existing open conversations
	    	if (convos.length > 0) {
	    		fulfill(convos);

	    	// we need to create new conversation(s)
	    	} else {

	    		// just in case [null] value was not submitted for clients in lieu of none
	    		if (clients.length == 0) { clients = [null]; }

		    	var insertList = [];
		    	for (var i = 0; i < clients.length; i++) {
		    		var client = clients[i];
		    		var insertObj = {
		    			"cm": null,
		    			"client": client,
		    			"open": true,
		    			"accepted": false
		    		}
		    		insertList.push(insertObj);
		    	}

			    db("convos")
			    .insert(insertList)
			    .returning("convid")
			    .then(function (convos) {
			    	fulfill(convos);
			    }).catch(function (err) {
					  reject(err);
					});

	    	}
	    }).catch(function (err) {
			  reject(err);
			});
		});
	},

	register_message: function (text, commid, convos) {
    return new Promise (function (fulfill, reject) {
    	var insertList = [];
    	for (var i = 0; i < convos.length; i++) {
    		var convo = convos[i];
    		var insertObj = {
    			"convo": convo,
    			"comm": commid,
    			"content": text,
    			"inbound": true,
    			"read": false
    		}
    		insertList.push(insertObj);
    	}

	    db("msgs")
	    .insert(insertList)
	    .returning("convid")
	    .then(function (convos) {
	    	fulfill(convos);
	    }).catch(function (err) {
			  reject(err);
			});
		});
	}

}




