


// SECRET STUFF
var credentials = require("../credentials");
var ACCOUNT_SID = credentials.accountSid;
var AUTH_TOKEN = credentials.authToken;
var TWILIO_NUM = credentials.twilioNum;



// DEPENDENCIES
// DB via knex.js to run queries
var db  = require("../server/db");

// Twilio tools
var twilio = require("twilio");
var twClient = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);



module.exports = {

	checkSMSstatus: function () {

		db.select("*")
		.from("msgs")
		.leftJoin("comms", "comms.commid", "msgs.comm")
		.where("msgs.status_cleared", false)
		.then(function () {

		}).catch(function (err) { res.redirect("/500"); });

	}

};


module.exports.checkSMSstatus();


