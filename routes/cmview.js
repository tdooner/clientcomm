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
	  			res.render("client", {client: client[0], comms: comms});
	  		});
  		}
  	});
  });

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
  		comm.value = req.body.value;
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



  app.get("/fail", function (req, res) { res.send("FAIL") });

};
