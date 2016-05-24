var db  = require("../server/db");
var sms = require("../utils/utils.js")["sms"];
var pass = require("../utils/utils.js")["pass"];
var isSuper = pass.isSuper;
var isLoggedIn = pass.isLoggedIn;

module.exports = function (app, db, utils, passport) {

	app.get("/", function (req, res) {
		res.redirect("/login");
	});

	app.get("/login-fail", function (req, res) {
		req.flash("warning", "Email password combination did not work.");
		res.redirect("/login");
	});

	app.get("/login", function (req, res) {
		// check if the user is already logged in
		if (req.hasOwnProperty("user")) {
			res.redirect("/cms");
		} else {
			res.render("login");
		}
	});

  app.post("/login", passport.authenticate("local-login", {
      successRedirect: "/cms",
      failureRedirect: "/login-fail"
    })
  );

	app.get("/logout", isLoggedIn, function (req, res) {
		req.logout();
		req.flash("success", "Successfully logged out.");
		res.redirect("/")
	});

	// public stats
	app.get("/stats", function (req, res) {
		var rawQuery1 = " SELECT count(msgid), inbound, trunc(EXTRACT(HOUR FROM created)) AS date_hr " + 
										" FROM msgs " +
										" GROUP BY date_hr, inbound " +
										" ORDER BY date_hr ASC;";
		db.raw(rawQuery1).then(function (msgs) {

		var rawQuery2 = "SELECT COUNT(to_char(created, 'dy')), extract(dow FROM created) AS dow FROM msgs GROUP BY dow ORDER BY dow ASC;";
		db.raw(rawQuery2).then(function (days) {

		var rawQuery3 = "SELECT count(msgid) FROM msgs;";
		db.raw(rawQuery3).then(function (msgct) {

		var rawQuery4 = "SELECT count(convid) FROM convos WHERE convos.open = TRUE;";
		db.raw(rawQuery4).then(function (convosct) {

		var rawQuery5 = "SELECT count(clid) FROM clients WHERE clients.active = TRUE;";
		db.raw(rawQuery5).then(function (clsct) {

				res.render("stats", {msgs: msgs.rows, days: days.rows, overall: { msgs: msgct.rows[0].count, convos: convosct.rows[0].count, clients: clsct.rows[0].count } });

		}).catch(function (err) { res.redirect("/500"); });
		}).catch(function (err) { res.redirect("/500"); });
		}).catch(function (err) { res.redirect("/500"); });
		}).catch(function (err) { res.redirect("/500"); });
		}).catch(function (err) { res.redirect("/500"); });
	});

};
