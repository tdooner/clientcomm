var db  = require("../server/db");
var Promise = require("bluebird");
var twilio = require("twilio");

var twiml = new twilio.TwimlResponse();

module.exports = {

	logic_tree: function (state, text, msg) {
		var twiml = new twilio.TwimlResponse();
		return new Promise (function (fulfill, reject) {

			if (state == "initiate-resp") {

				text = text.replace("-Sent free from TextNow.com", "");
				var name = text.trim().split(" ");
				
				if (name.length > 1) {
					var first = name[0];
					var last = name[name.length - 1];
					var rawQuery = "SELECT * FROM clients WHERE LOWER(first) LIKE LOWER('%" + first + "%') AND LOWER(last) LIKE LOWER('%" + last + "%') AND active=TRUE;";

					db.raw(rawQuery).then(function (res) {
						if (res.hasOwnProperty("rows")) { 

							// we found no one
							if (res.rows.length == 0) {
								fulfill({state: "initiate-resp", msg: "Sorry we do not have the name " + name + " in the system. Try again with a different name or wait for a case manager to assist you."});

							// we got the person, we know who it is
							} else if (res.rows.length == 1) {
								var person = res.rows[0];
								var cm = person.cm;
								var cl = person.clid
								
								// udpate the associated conversation first with the client and case manager ids
								var rawQuery2 = "UPDATE convos SET cm=" + cm + ", client=" + cl + ", accepted = TRUE WHERE convos.convid = (SELECT convos.convid FROM msgs INNER JOIN convos ON (msgs.convo = convos.convid) WHERE msgs.msgid=" + msg + ");";
								db.raw(rawQuery2).then(function (success) {

									var d = new Date();
									var ccName = "New Contact Method on " + String(d.getMonth() + 1) + "/" + d.getDate();
									var rawQuery3 = "INSERT INTO commconns (client, comm, name, created) VALUES (" + cl + ", (SELECT commid FROM comms WHERE comms.commid = (SELECT msgs.comm FROM msgs WHERE msgs.msgid = " + msg + ") LIMIT 1), '" + ccName + "', now())";
									console.log("rawQuery3", rawQuery3);
									db.raw(rawQuery3).then(function (success) {
										fulfill({state: false, msg: "Thanks! We have added this number to your contacts and forwarded the message on to your case manager."});

									}).catch(function (err) { reject(err); });
								}).catch(function (err) { reject(err); });

								// need to do 2 things:
								// 1 update convo
								// 2 create a comm conn to the client

							// we got more than one result
							} else {
								console.log("More than one result.")

							}
							
						} else { reject("Function logic_tree failed to return row values correctly.") };
					}).catch(function (err) { reject(err); });
				} else { fulfill({state: "initiate-resp", msg: "Please provide a first & last name, separated by a space. Example: JANE DOE"}); }

			} else {

			}

		});
	}

}




