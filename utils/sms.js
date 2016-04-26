var db  = require("../server/db");
var Promise = require("bluebird");

module.exports = {

	process_incoming_msg: function (from, text, tw_status, tw_sid) {
		var sms = this;
		return new Promise (function (fulfill, reject) {

			var commid;
			sms.get_or_create_comm_device(from).then(get_clients).catch(errReject);
			
			function get_clients (device) {
				if (device.length > 0) {
					commid = device[0];
					sms.get_clients(commid).then(get_or_create_convos).catch(errReject)
				} else {
					errReject("Failed to create a comm device.");
				}
			};

			function get_or_create_convos (clients, from) {
				if (clients.length > 0) {
					sms.get_or_create_convos(clients, from).then(register_message).catch(errReject)
				} else {
					errReject("Failed to produce client or null list value.");
				}
			};

			function register_message (convos) {
				if (convos.length > 0) {
					sms.register_message(text, commid, convos, tw_status, tw_sid).then(fulfill).catch(errReject)
				} else {
					errReject("Failed to produce convos list.");
				}
			};

			function errReject (err) {
				reject(String(err));
			};

		});
	},

	clean_phonenum: function (from) {
		if (from) {
			from = from.replace(/\D+/g, "");
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
		  db.select("commid").from("comms").where("value", from).limit(1)
		  .then(function (comms) {

		  	// return list of comms
		  	if (comms.length > 0) {
		    	comms = comms.map(function (ea) { return ea.commid; });
		  		fulfill(comms);

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
	    .innerJoin("cms", "clients.cm", "cms.cmid")
	    .whereNull("commconns.retired")
	    .andWhere("commconns.comm", commid)
	    .then(function (clients) {
	    	clients = clients.map(function (ea) {
	    		return {clid: ea.clid, cmid: ea.cm};
	    	});

	    	if (clients.length == 0) {
	    		clients = [{clid: null, cmid: null}];
	    	}
	    	fulfill(clients);
	    }).catch(function (err) {
			  reject(err);
			});
		});
	},
	
	get_or_create_convos: function (clients, from) {
    return new Promise (function (fulfill, reject) {
    	var cls = clients.map(function (ea) { return ea.clid; });
    	var cms = clients.map(function (ea) { return ea.cmid; });

	    db("convos")
	    .whereIn("client", cls)
	    .andWhere("convos.open", true)
	    .then(function (convos) {
	    	// clean up response
	    	convos = convos.map(function (ea) { return ea.convid; });

	    	// there are existing open conversations
	    	if (convos.length > 0) {
	    		fulfill(convos);

	    	// we need to check if there is an unlinked convo associated to this 
	    	} else {

	    		db.select("convos.convid").from("comms")
	    		.innerJoin("msgs", "comms.commid", "msgs.comm")
	    		.innerJoin("convos", "msgs.convo", "convos.convid")
	    		.where("convos.open", true)
	    		.andWhere("comms.value", from)
	    		.andWhere("convos.cm", null)
	    		.andWhere("convos.client", null)
	    		.groupBy("convos.convid")
			    .then(function (convos) {

			    	// there are existing open conversations
			    	if (convos.length > 0) {
			    		convos = convos.map(function (ea) { return ea.convid; });
			    		fulfill(convos);

			    	} else {

			    		// just in case [null] value was not submitted for clients in lieu of none
			    		if (clients.length == 0) { clients = [{clid: null, cmid: null}]; }

				    	var insertList = [];
				    	var now = new Date(Date.now()).toISOString().split("T");
				    	var subject = "New Convo " + now[0] + " at " + now[1].replace("Z", "");

				    	for (var i = 0; i < clients.length; i++) {
				    		var client = clients[i];
				    		var insertObj = {
				    			"cm": client.cmid,
				    			"client": client.clid,
				    			"subject": subject,
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

	    	}
	    }).catch(function (err) {
			  reject(err);
			});
		});
	},

	register_message: function (text, commid, convos, tw_status, tw_sid) {
    return new Promise (function (fulfill, reject) {
    	var insertList = [];
    	for (var i = 0; i < convos.length; i++) {
    		var convo = convos[i];
    		for (var ii = 0; ii < text.length; ii++) {
	    		var textPart = text[ii];
	    		console.log("textPart", ii, textPart, commid);

	    		var insertObj = {
	    			"convo": convo,
	    			"comm": commid,
	    			"content": textPart,
	    			"inbound": true,
	    			"read": false,
	    			"tw_sid": tw_sid,
	    			"tw_status": tw_status
	    		}
	    		insertList.push(insertObj);    			
    		}
    	}

	    db("msgs")
	    .insert(insertList)
	    .returning("msgid")
	    .then(function (msgs) {

	    	db("convos").whereIn("convid", convos)
	    	.update({updated: db.fn.now()})
	    	.then(function (success) {
	    		fulfill(msgs);
	    	}).catch(function (err) {
	    		reject(err);
	    	})

	    }).catch(function (err) {
			  reject(err);
			});
		});
	}

}




