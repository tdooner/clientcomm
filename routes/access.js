var db  = require("../server/db");
var sms = require("../utils/utils.js")["sms"];
var pass = require("../utils/utils.js")["pass"];
var isSuper = pass.isSuper;
var isLoggedIn = pass.isLoggedIn;

module.exports = function (app, db, utils, passport) {

	app.get("/", function (req, res) {
		var warning = req.flash("warning");
		var success = req.flash("success");
		res.render("index", {
			warning: warning,
			success: success
		});
	});

	app.get("/login", function (req, res) {
		var warning = req.flash("warning");
		var success = req.flash("success");
		if (req.hasOwnProperty("user")) {
			res.redirect("/cms");
		} else {
			res.render("login", {
				warning: warning,
				success: success
			});
		}
	});

  app.post("/login", passport.authenticate("local-login", {
      successRedirect: "/cms",
      failureRedirect: "/login"
    })
  );

	app.get("/logout", isLoggedIn, function (req, res) {
		req.logout();
		req.flash("success", "Successfully logged out.");
		res.redirect("/")
	});

};
