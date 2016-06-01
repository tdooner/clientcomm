var db  = require("../server/db");
var Promise = require("bluebird");

module.exports = {

	fivehundred: function (res) { 
		return function (err) {
			
			// Log the error if passed in
			if (typeof err !== "undefined") {
				console.log("Error occured. \n Timestampt: " + new Date());
				console.log(err);
				console.log("---");
			}

			// Run the redirect
			res.redirect("/500"); 
		}
	}

}




