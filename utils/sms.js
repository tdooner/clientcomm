var db  = require("../server/db");
var Promise = require("bluebird");

module.exports = {

	process_incoming_msg: function (from, text, tw_status, tw_sid) {
		var that = this;
		return new Promise (function (fulfill, reject) {
	    that.get_or_create_comm_device(from)
	    .then(function (device) {

	      // if this communication device exists in the system already
	      if (device.length > 0) {
	        var commid = device[0];

	        // get clients
	        that.get_clients(commid)
	        .then(function (clients) {

	          // at least one client should be returned
	          if (clients.length > 0) {
	            that.get_or_create_convos(clients, from)
	            .then(function (convos) {
	              // need to make sure that there are existing convos
	              if (convos.length > 0) {
	                that.register_message(text, commid, convos, tw_status, tw_sid)
	                .then(function (msgs) {
	                	fulfill(msgs);

	                }).catch(function (err) {
	                  reject(err);
	                });

	              // convos list should have been returned
	              } else {
	                reject("Failed to produce convos list.");
	              }

	            }).catch(function (err) {
	              reject(err);
	            });

	          // a client or null val should have been returned
	          } else {
	            reject("Failed to produce client or null list value.");
	          }

	        }).catch(function (err) {
	          reject(err);
	        });

	      // that number does not currently exist
	      } else {
	        reject("Failed to create a comm device.")
	      } 
	    }).catch(function (err) {
	      reject(err);
	    });
		});
	},

	clean_from_val: function (from) {
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

	    	// we need to check if there is an unlinked convo associated to this 
	    	} else {

	    		db.select("convos.convid").from("comms")
	    		.innerJoin("msgs", "comms.commid", "msgs.comm")
	    		.innerJoin("convos", "msgs.convo", "convos.convid")
	    		.where("convos.open", true)
	    		.groupBy("convos.convid")
			    .then(function (convos) {

			    	// clean up response
			    	convos = convos.map(function (ea) { return ea.convid; });

			    	// there are existing open conversations
			    	if (convos.length > 0) {
			    		fulfill(convos);

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
    		var insertObj = {
    			"convo": convo,
    			"comm": commid,
    			"content": text,
    			"inbound": true,
    			"read": false,
    			"tw_sid": tw_sid,
    			"tw_status": tw_status
    		}
    		insertList.push(insertObj);
    	}

	    db("msgs")
	    .insert(insertList)
	    .returning("msgid")
	    .then(function (msgs) {
	    	fulfill(msgs);
	    }).catch(function (err) {
			  reject(err);
			});
		});
	}

}




