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
	
	check_if_comm_device_exists: function (from) {
		return new Promise (function (fulfill, reject) {
		  // acquire commid
		  db("comms").where("value", from).limit(1)
		  .then(function (comm) {
				fulfill(comm);
		  }).catch(function (err) {
			  reject(err);
			});
		});
	},

	create_new_device: function (from) {
		return new Promise (function (fulfill, reject) {
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
		});
	},
	
	get_related_clients: function (commid) {
    return new Promise (function (fulfill, reject) {
	    db("clients")
	    .innerJoin("commconns", "commconns.client", "clients.clid")
	    .innerJoin("comms", "commconns.comm", "comms.commid")
	    .whereNull("commconns.retired")
	    .andWhere("commconns.comm", commid)
	    .pluck("clients.clid")
	    .then(function (commconns) {
	    	fulfill(commconns);
	    }).catch(function (err) {
			  reject(err);
			});
		})
	},
	
	retrieve_convos: function (commid) {
    return new Promise (function (fulfill, reject) {
	    db("commconns")
	    .innerJoin("convos", "commconns.client", "convos.client")
	    .innerJoin("clients", "commconns.client", "clients.clid")
	    .innerJoin("cms", "cms.cmid", "clients.cm")
	    .whereNotNull("commconns.retired")
	    .andWhere("commconns.comm", commid)
	    .andWhere("convos.current", true)
	    .then(function (commconns) {
	    	fulfill(commconns);
	    }).catch(function (err) {
			  reject(err);
			});
		})
	}

}