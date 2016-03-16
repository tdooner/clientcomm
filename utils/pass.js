var bcrypt = require("bcrypt-nodejs");

module.exports = function () {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) { 
			return next(); 
		} else { 
			res.redirect("/login"); 
		}
	};

	function hashPw (pw) { 
		return bcrypt.hashSync(pw, bcrypt.genSaltSync(8), null); 
	};

	function validPw (pw1, pw2) { 
		return bcrypt.compareSync(pw1, pw2); 
	};
}