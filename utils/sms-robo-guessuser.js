var db  = require("../server/db");
var Promise = require("bluebird");
var twilio = require("twilio");

var twiml = new twilio.TwimlResponse();

module.exports = {

	initiate: function () {
		var twiml = new twilio.TwimlResponse();
		return new Promise (function (fulfill, reject) {
			twiml.sms('Sounestions.');
			console.log(twiml.toString());
		});
	},

	clean_phonenum: function (from) {
		if (from) {
			from = from.replace(/\D+/g, "");
			if (from.length == 10) {
				from = "1" + from;
			}

			if (from.length == 11) {
				return from;
			} else {
				return null;
			}

		} else {
			return null;
		}
	}

}




