var twilio = require("twilio");
var sms = require("../utils/utils.js")["sms"];

module.exports = function (app) {

  app.post("/sms", function (req, res) {

    var twiml = new twilio.TwimlResponse();
    var from = sms.clean_phonenum(req.body.From);
    var text = req.body.Body;

    var tw_status = req.body.SmsStatus;
    var tw_sid = req.body.MessageSid;

    if (typeof text == "string") {
      if (from.length > 159) {
        text = text.replace("-Sent free from TextNow.com", "").trim();
        text = text.substr(0, 160);
      }

      // break the string up into 160 or less char length segments
      text = text.match(/.{1,159}/g);
      
      sms.process_incoming_msg(from, text, tw_status, tw_sid)
      .then(function (msgs) {
        // do nothing for now
        var now = new Date(Date.now()).toISOString().split("T");
        console.log("Message received from " + from + " on " + now[0] + " at " + now[1]);

      }).catch(function (err) {
        handleError(err);
      })

    } else {
      handleError("Text value submitted is not a string.");
    }

    function handleError (err) {
      var now = new Date(Date.now()).toISOString().split("T");
      console.log("Error occurred on " + now[0] + " at " + now[1] + ": " + err);
      res.status(404).send(err);
      return false;
    };

  });

};
