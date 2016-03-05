var local = require("passport-local").Strategy;
var bcrypt = require("bcrypt-nodejs");
var db = require("./db");

// expose this function to our app using module.exports
module.exports = function (passport) {

	// bcrypt methods
	hashPw = function(pw) { return bcrypt.hashSync(pw, bcrypt.genSaltSync(8), null); };
	validPw = function(pw1, pw2) { return bcrypt.compareSync(pw1, pw2); };

	passport.serializeUser(function (user, done) {
		done(null, user.aid);
	});

	passport.deserializeUser(function (id, done) {
		db("cms").where("cmid", id).limit(1)
		.then(function (cm) {
			if (cm.constructor === Array) { cm = cm[0]; }
			done(null, cm);
		})
		.catch(function (err) {
			done(err, null);
		});
	});

	passport.use("local-signup", new local({
			usernameField: "email",
			passwordField: "pass",
			passReqToCallback: true
		},

		function (req, email, password, done) {

			// first make sure that pw and emails match
			var pw_match = (req.body.pass == req.body.pass2);
			var em_match = (req.body.email == req.body.email2);
			var name_ok = (req.body.name && req.body.name !== "" && req.body.name.length > 0)

			if (pw_match && em_match && name_ok) {
				process.nextTick(function () {
					db("cms").where("email", email).limit(1)
					.then(function (cm) {
						if (cm.constructor === Array && cm.length == 1) {
							return done(null, false);
						} else {
							var new_cm = {};
							
							new_cm.first = req.body.first;
							new_cm.middle = req.body.middle;
							new_cm.last = req.body.last;

							new_cm.position = req.body.position;
							new_cm.department = req.body.department;

							new_cm.email = email;
							new_cm.pass = hashPw(password);

							// insert the new admin user
							db("cms").insert(new_cm)
							.then(function () {

								// query to get the new result, needs to be refactored
								db("cms").where("email", email).limit(1)
								.then(function (admin) {
									if (admin.constructor === Array && admin.length == 1) {
										return done(null, admin[0]);
									} else {
										return done(null, false)
									};
								})
								.catch(function (err) {
									return done(err);
								});

							})
							.catch(function (err) {
								return done(err);
							});
						}
					})
					.catch(function (err) {
						return done(err);
					})
				});				
			} else {
				return done(null)
			}
		})
	);

	passport.use("local-login", new local({
			usernameField: "email",
			passwordField: "pass",
			passReqToCallback: true
		},

		function (req, email, password, done) {
			process.nextTick(function () {

				db("admins").where("email", email).limit(1)
				.then(function (admin) {
					if (admin.constructor === Array && admin.length == 1) {
						admin = admin[0];
						if (validPw(password, admin.pass)) {
							return done(null, admin);

						// fails because bad password
						} else {
							return done(null, false);
						}
					} else {
						return done(null, false);
					}
				})
				.catch(function (err) {
					return done(err);
				})
			});
		})
	);
};





