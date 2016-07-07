var db  = require("../server/db");
var sms = require("../utils/utils.js")["sms"];

var twilio = require("twilio");

var twiml = new twilio.TwimlResponse();

module.exports = {

  checkAndSendNotifications: function () {
    db("notifications")
    .where("send", ">", db.fn.now())
    .then(function (notifications) {
      console.log(notifications)

      notifications.forEach(function (argument) {
        // use sms utils to send out messages for each
      });

    }).catch(function (err) {
      console.log(err);
    })
  }

}




