var db  = require("../server/db");

module.exports = function (app, db, utils, passport) {

	app.get("/", function (req, res) {
		res.render("index", {notLoggedIn: true});
	});

	app.get("/super", function (req, res) {
		db("orgs").orderBy("name")
		.then(function (orgs) {
			var warning = req.flash("warning");
			var success = req.flash("success");

			res.render("super-login", {
				orgs: orgs,
				warning: warning,
				success: success
			});
		}).catch(function (err) {
			res.redirect("/500");
		});
	});

	app.post("/super/org", function (req, res) {
		var name = req.body.name;
		var email = req.body.email;
		var expiration = req.body.expiration;
		var allotment = Number(req.body.allotment);

		if (!name) {
			req.flash("warning", "Missing name.");
			res.redirect("/super");
		} else if (!email) {
			res.render("super-login", {warning: "Missing email."});
		} else if (isNaN(Date.parse(expiration))) {
			res.render("super-login", {warning: "Missing expiration date."});
		} else if (isNaN(allotment)) {
			res.render("super-login", {warning: "Missing allotment."});
		} else {
			db("orgs")
			.where("name", name)
			.orWhere("email", email)
			.then(function (response) {

				if (response.length == 0) {
					db("orgs").insert({
						name: name,
						email: email,
						expiration: expiration,
						allotment: allotment
					}).then(function (response) {
						res.render("super-login", {success: "Successful entry."});
					}).catch(function (err) {
						res.render("super-login", {warning: "Failed to create new entry."});
					});

				} else {
					req.flash("warning", "That name or email already exists.");
					res.redirect("/super");
				}

			}).catch(function (err) {
				res.render("super-login", {warning: "Error on searching for pre-existing organizations."});
			});
		}
	});

	app.get("/signup", function (req, res) {
		res.render("signup", {notLoggedIn: true});
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

  app.get("/500", function (req, res) {
  	res.status(500).send("Something happened.")
  })

};
