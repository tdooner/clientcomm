module.exports = function (app, db, utils, passport) {

	// view current clients for a case manager
  app.get("/cmview", utils.isLoggedIn, function (req, res) { 
  	
  	db("clients").where("cm", req.user.cmid).then(function (clients) {
  		res.render("clients", {clients: clients});
  	});
  	
  });

  // create new client
  app.post("/cmview", utils.isLoggedIn, function (req, res) { 
  	var cl = {
  		cm: req.user.cmid,
  	};

	  cl.first = req.body.first;
	  if (!cl.first || cl.first == "" || cl.first.length < 1) {
	  	res.send("First name is missing or too short. " + ahref);
	  }

	  if (req.body.middle !== "" && req.body.middle.length < 1) {
	  	cl.middle = req.body.middle;
	  }

	  cl.last = req.body.last;
	  if (!cl.last || cl.last !== "" && cl.last.length < 1) {
	  	res.send("Last name is missing or too short. " + ahref);
	  }

	  if (req.body.otn) cl.otn = req.body.otn;
	  if (req.body.so) cl.so = req.body.so;

  	db("clients").insert(cl).then(function (clients) {
  		res.redirect("cmview");
  	});
  	
  });

  app.get("/cmview/:clid", utils.isLoggedIn, function (req, res) { 
  	var clid = req.params.clid;
  	db("clients").where("cm", req.user.cmid).andWhere("clid", clid).then(function (client) {
  		if (client.length < 1) {
  			res.send("You are unauthorized to access this client's data.")
  		} else {
	  		db("comms").where("client", clid).then(function (comms) {
	  			db("msgs").where("client", clid).orderBy("created", "asc").then(function (msgs) {
	  				var tw_client = require("twilio")(utils.accountSid, utils.authToken);
	  				for (var i = 0; i < msgs.length; i++) { 
	  					var m = msgs[i];

	  					// update statuses
	  					if (m.tw_status !== "delivered" || m.tw_status !== "failed" || m.tw_status !== "received") {
								tw_client.sms.messages(m.tw_sid).get(function (err, sms) {
									if (!err) {
										if (sms.status !== m.tw_status) {
											db("msgs").where("tw_sid", m.tw_sid)
											.returning("tw_status")
											.update({tw_status: sms.status}).then(function () {});
										}
									}
								});
	  					}

	  					// update read status
	  					if (!m.read) {
								db("msgs").where("tw_sid", m.tw_sid)
								.update({read: true}).then(function () {});
	  					}
	  				}

	  				// render regardless of above ops
	  				res.render("client", {client: client[0], comms: comms, msgs: msgs});
	  			});
  			});
  		}
  	});
  });

  // add new device to user
  app.post("/cmview/:clid/comm", utils.isLoggedIn, function (req, res) { 
  	var clid = req.params.clid;
  	var ahref = "<a href='/cmview/" + clid + "'>Return to user.</a>";

  	var comm = {}
  	if (!req.body.hasOwnProperty("type")) {
  		res.send("Missing Type. " + ahref);
  	} else {
  		comm.type = req.body.type;
  	}

  	if (!req.body.hasOwnProperty("value")) {
  		res.send("Missing Value. " + ahref);
  	} else {
  		var v = req.body.value;
  		if (comm.type == "email" || comm.type == "cell") { 
  			v = v.replace(/[^0-9.]/g, "");
  			if (v.length == 10) {
  				v = "1" + v;
  			}
  			if (v.length == 11) {
  				comm.value = v;	
  			} else {
  				res.send("Bad phone entry. Make sure it includes the country code (e.g. 1-848-123-4567). " + ahref);
  			}
  		} else {
  			comm.value = v;
  		}
  	}

  	if (!req.body.hasOwnProperty("description")) {
  		res.send("Missing Description. " + ahref);
  	} else {
  		comm.description = req.body.description;
  	}

  	comm.client = clid;
  	db("comms").insert(comm).then(function (client) {
  		res.redirect("/cmview/" + clid);
  	});
  });

  app.post("/cmview/:clid/send", utils.isLoggedIn, function (req, res) { 
  	var clid = req.params.clid;
  	var ahref = "<a href='/cmview/" + clid + "'>Return to user.</a>";

  	if (req.body.hasOwnProperty("device")) {
  		console.log(req.body.device);
  		req.body.device = JSON.parse(req.body.device);
  	}

  	var comm = {}
  	if (!req.body.device.hasOwnProperty("commid")) {
  		res.send("Missing communication id. " + ahref);
  	} else {
  		comm.comm = req.body.device.commid;
  	}

  	if (!req.body.device.hasOwnProperty("value")) {
  		res.send("Missing communication value. " + ahref);
  	}

  	if (!req.body.hasOwnProperty("content")) {
  		res.send("Missing message body. " + ahref);
  	} else {
  		comm.content = req.body.content;
  	}

  	comm.client = clid;
  	comm.read = true;

		var client = require("twilio")(utils.accountSid, utils.authToken);
		client.messages.create({
	    body: comm.content,
	    to: req.body.device.value,
	    from: utils.twilioNum
		}, function(err, message) {
			if (err) {
				res.send("There was an error. " + ahref + "<br>" + err);
			} else {
				comm.tw_sid = message.sid;
				comm.tw_status = message.status;
		  	db("msgs").insert(comm).then(function (client) {
		  		res.redirect("/cmview/" + clid);
		  	});
			}
		});
  });



  app.get("/fail", function (req, res) { res.send("FAIL") });

};
