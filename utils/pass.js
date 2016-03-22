var bcrypt = require("bcrypt-nodejs");

module.exports = {

	isLoggedIn: function (req, res, next) {
		if (req.isAuthenticated()) { 
			return next(); 
		} else { 
			req.flash("warning", "No access allowed, not logged in.");
			res.redirect("/login"); 
		}
	},

	isSuper: function (req, res, next) {
		if (req.isAuthenticated() && req.user.hasOwnProperty("superuser") && req.user.superuser) { 
			return next(); 
		} else { 
			req.flash("warning", "No access allowed, you do not have superuser access.");
			res.redirect("/login"); 
		}
	},

	hashPw: function (pw) { 
		return bcrypt.hashSync(pw, bcrypt.genSaltSync(8), null); 
	},

	validPw: function (pw1, pw2) { 
		return bcrypt.compareSync(pw1, pw2); 
	}
}