module.exports = function (app, db, utils, passport) {

	app.get("/", function (req, res) {
		res.render("index");
	});

	app.get("/signup", function (req, res) {
		res.render("signup");
	});

	app.post("/signup", function (req, res) {
		var ahref = "<a href='/signup'>Return to signup.</a>";
		
		var cm = {};

	  cm.first = req.body.first.toUpperCase();
	  if (!cm.first || cm.first == "" || cm.first.length < 1) {
	  	res.send("First name is missing or too short. " + ahref);
	  }

	  if (req.body.middle !== "" && req.body.middle.length < 1) {
	  	cm.middle = req.body.middle.toUpperCase();
	  }

	  cm.last = req.body.last.toUpperCase();
	  if (!cm.last || cm.last !== "" && cm.last.length < 1) {
	  	res.send("Last name is missing or too short. " + ahref);
	  }

	  if (req.body.email !== req.body.email2) {
	  	res.send("Emails do not match. " + ahref);
	  } else if (req.body.email.length < 5) {
	  	res.send("Email is too short. " + ahref);
	  } else {
	  	cm.email = req.body.email;
	  }

	  if (req.body.pass !== req.body.pass2) {
	  	res.send("Passwords do not match. " + ahref);
	  } else if (req.body.pass.length < 5) {
	  	res.send("Password is too short. " + ahref);
	  } else {
	  	cm.pass = utils.hashPw(req.body.pass);
	  }

	  cm.position = req.body.position;
	  if (!cm.position || cm.position == "" || cm.position.length < 1) {
	  	res.send("Position is missing or too short. " + ahref);
	  }

	  cm.department = req.body.department;
	  if (!cm.department || cm.department == "" || cm.department.length < 1) {
	  	res.send("Department is missing or too short. " + ahref);
	  }

		db("cms").where("email", cm.email).limit(1).then(function (emails) {
			if (emails.length == 0) {
				db("cms").insert(cm).then(function () {
					res.send("It's been entered. Go to <a href='/login'>login</a>.");
				});
			} else {
				res.send("This email is already being used, try a different one. " + ahref);
			}
		});
	});

	app.get("/login", function (req, res) {
		res.render("login")
	});

  app.post("/login", passport.authenticate("local-login", {
      successRedirect: "/cmview",
      failureRedirect: "/fail"
    })
  );

};
