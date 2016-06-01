


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


var module = {}; // REMOVE
module.exports = {

	checkSMSstatus: function () {

		db.select("*")
		.from("msgs")
		.leftJoin("comms", "comms.commid", "msgs.comm")
		.where("msgs.status_cleared", false)
		.limit(1)
		.then(function (msgs) {

			// Iterate through list, checking to see if any have changes status
			for (var i = 0; i < msgs.length; i++) {
				checkMsgAgainstTwilio(msgs[i]);
			}
			
		}).catch(function (err) { console.log(err); });

	}

};

function checkMsgAgainstTwilio (msg) {

	// Hit up Twilio API for the 
	twClient.sms.messages(msg.tw_sid)
	.get(function (err, sms) {

		// Handling for messages sent to Twilio
		if (sms.direction == "inbound") {
			// If no change occured over msg prior status
			if (msg.tw_status == sms.status) {
				// We can close out cleared messages
				if (sms.status == "received") {
					db("msgs")
					.where("msgid", msg.msgid)
					.update({status_cleared: true})
					.then(function (success) {
						console.log("Cleared msg " + msg.msgid);
					}).catch(function (err) { console.log(err); });
				}
			}

		// Handling for messages received by Twilio
		} else {

		}
};


module.exports.checkSMSstatus();


