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
  		res.send(clients);
  		// res.render("clients", {clients: clients});
  	});
  	
  });

  app.get("/cmview/:clid", function (req, res) { 
  	var clid = req.params.clid;
  	db("clients").where("cm", req.user.cmid).andWhere("clid", clid).then(function (client) {
  		res.render("client", {client: client});
  	});
  });



  app.get("/fail", function (req, res) { res.send("FAIL") });

};
