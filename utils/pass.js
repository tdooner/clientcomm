var bcrypt = require("bcrypt-nodejs");

module.exports = {

	isLoggedIn: function (req, res, next) {
		if (req.isAuthenticated()) { 
			return next(); 
		} else { 
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