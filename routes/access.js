


// DEPENDENCIES
// DB via knex.js to run queries
var db  = require("../server/db");

// Utility checks if a client is logged in
var pass = require("../utils/utils.js")["pass"];
var isLoggedIn = pass.isLoggedIn;



module.exports = function (app, passport) {


	// MAIN PAGE CURRENTLY ROUTES STRAIGHT TO LOGIN
	// TO DO: Make a splash page (GH Issue: https://github.com/slco-2016/clientcomm/issues/72)
	app.get("/", function (req, res) {
		res.redirect("/login");
	});


	// LOGIN PAGE RENDER
	app.get("/login", function (req, res) {
		// check if the user is already logged in
		if (req.hasOwnProperty("user")) { res.redirect("/cms"); } 
		else { res.render("login"); }
	});


	// LOGIN REQUEST & PASSPORT LOGIN LOGIC
  app.post("/login", passport.authenticate("local-login", {
      successRedirect: "/cms",
      failureRedirect: "/login-fail"
    })
  );


	// LOGIN FAIL REROUTE LOGIC
	// TO DO: This supports the Passport POST for login, 
	//        there is likely better way to do this without reroute
	app.get("/login-fail", function (req, res) {
		req.flash("warning", "Email password combination did not work.");
		res.redirect("/login");
	});


  // LOGOUT
	app.get("/logout", isLoggedIn, function (req, res) {
		req.logout();
		req.flash("success", "Successfully logged out.");
		res.redirect("/")
	});


	// PUBLIC STATS VIEW
	// TO DO: As tool increases in size, we need this to not hit up the actual data base but to show some numbers that are crunches X times a day.
	app.get("/stats", function (req, res) {

		// Get msg counts, grouped by hour and out/inbound
		var rawQuery1 = " SELECT count(msgid), inbound, trunc(EXTRACT(HOUR FROM created)) AS date_hr " + 
										" FROM msgs " +
										" GROUP BY date_hr, inbound " +
										" ORDER BY date_hr ASC;";
		db.raw(rawQuery1).then(function (msgs) {

		// Get msg counts by day of week
		var rawQuery2 = "SELECT COUNT(to_char(created, 'dy')), extract(dow FROM created) AS dow FROM msgs GROUP BY dow ORDER BY dow ASC;";
		db.raw(rawQuery2).then(function (days) {

		// Get total msg count
		var rawQuery3 = "SELECT count(msgid) FROM msgs;";
		db.raw(rawQuery3).then(function (msgct) {

		// Get number of currently active convos
		var rawQuery4 = "SELECT count(convid) FROM convos WHERE convos.open = TRUE;";
		db.raw(rawQuery4).then(function (convosct) {

		// Get number of currently active clients
		var rawQuery5 = "SELECT count(clid) FROM clients WHERE clients.active = TRUE;";
		db.raw(rawQuery5).then(function (clsct) {

				res.render("stats", {msgs: msgs.rows, days: days.rows, overall: { msgs: msgct.rows[0].count, convos: convosct.rows[0].count, clients: clsct.rows[0].count } });

		}).catch(function (err) { res.redirect("/500"); }); // query 1
		}).catch(function (err) { res.redirect("/500"); }); // query 2
		}).catch(function (err) { res.redirect("/500"); }); // query 3
		}).catch(function (err) { res.redirect("/500"); }); // query 4
		}).catch(function (err) { res.redirect("/500"); }); // query 5
	});

};



