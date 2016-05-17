var db = require("../server/db");

var credentials = require("../credentials");
var empw = credentials.em.password;

// create reusable transporter object using the default SMTP transport
var smtps = "smtps://kuan%40codeforamerica.org:" + empw + "@smtp.gmail.com";
var transporter = nodemailer.createTransport(smtps);

module.exports = {
	runEmailUpdates: function () {
		var rawQuery =  " SELECT count(msgid), MAX(msgs.created) AS made, cms.cmid, cms.first, cms.last, cms.email " +
										" FROM msgs " + 
										" LEFT JOIN (SELECT convos.convid, convos.cm FROM convos) AS convos ON (convos.convid = msgs.convo) " +
										" LEFT JOIN (SELECT cms.cmid, cms.first, cms.last, cms.email FROM cms) AS cms ON (cms.cmid = convos.cm) " + 
										" WHERE msgs.read = FALSE AND msgs.created > CURRENT_TIMESTAMP - INTERVAL '1 day' " +
										" AND msgs.created < CURRENT_TIMESTAMP " +
										" GROUP BY cms.cmid, cms.first, cms.last, cms.email ORDER BY made DESC; ";

		db.raw(rawQuery).then(function (msgs) {
			msgs.rows.forEach(function (msg, i) {

				var text =  " Hello " + msg.first + " " + msg.last + ", this is Kuan from Code for America. " + 
										" You are receiving this automated email because you have " + msg.count + " message(s) waiting for you in ClientComm that is more than 4 hours old. " +
										" To view this message go to ClientComm.org and login with your user name and password. " +
										" If you are having issues accessing your account, send me an email at kuan@codeforamerica.org and I will be happy to assist you any time, day or night!"; 

				var mailOptions = {
					from: '"ClientComm - CJS" <kuan@codeforamerica.org>', 
					to: msg.email, 
					subject: "Alert: New Unread ClientComm Messages!", 
					text: text, 
					html: text 
				};

				// send mail with defined transport object
				transporter.sendMail(mailOptions, function(error, info){
				    if (error) { console.log(error); } 
				    else { console.log('Message sent: ' + info.response); }

				    if (i == msgs.length - 1) { setTimeout(function () { console.log("COMPLETED EMAIL NOTIFICATIONS."); }, 2000) }
				});	
			});

			if (msgs.rows.length == 0) { setTimeout(function () { console.log("COMPLETED EMAIL NOTIFICATIONS (and there were no new notifications)."); }, 2000) }

		}).catch(function (err) { 
			console.log(err); 
		});


	}
};



