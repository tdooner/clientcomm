var twilio = require("twilio");
var sms = require("../utils/utils.js")["sms"];
var smsguess = require("../utils/utils.js")["smsguessuser"];

module.exports = function (app) {

  app.post("/sms", function (req, res) {

    var from = sms.clean_phonenum(req.body.From);
    var text = req.body.Body;

    var tw_status = req.body.SmsStatus;
    var tw_sid = req.body.MessageSid;

    // just leaving this in for now while we use free service for testing
    text = text.replace("-Sent free from TextNow.com", "").trim();

    // break the string up into 160 or less char length segments
    text = text.match(/.{1,159}/g);
    
    sms.process_incoming_msg(from, text, tw_status, tw_sid)
    .then(function (msgs) {

      // we don't handle if multiple messages are created currently how that translates into new message logic
      // we need to enhance later code to incorporate this
      if (msgs.length !== 1) {
        sendEmptyRes();

      } else {
        var msg = msgs[0];
        sms.check_new_unknown_msg(msg).then(function (isNew) {
          
          // if new, then initiate figuring out who person is
          if (isNew) {
            console.log("got new")
            req.session.ccstate = "initiate-resp";
            res.send("<?xml version='1.0' encoding='UTF-8'?><Response><Sms>This # is not registered. Help us find you. Reply with your name in the following format: FIRST M LAST.</Sms></Response>");

          // if ongoing auto convo, then continue
          } else if (req.session.hasOwnProperty("ccstate")) { 
            console.log("has ccstate!!", req.session.ccstate);

          // see if the person has not been serviced in a long time
          } else { 
            console.log("not either of above")
            
            // check when last response was
            sms.check_last_unread(msg).then(function (unreadDate) {
              if (unreadDate) {
                try {
                  var d1 = new Date(unreadDate);
                  var d2 = new Date();
                  var diff = (d2.getTime() - d1.getTime()) / (3600*1000);

                  // if it's been more than 4 hours let's notify the case manager
                  if (diff > 4) {
                    // but only if it is not a weekend
                    if (d2.getDay() == 6 || d2.getDay() == 0) {
                      res.send("<?xml version='1.0' encoding='UTF-8'?><Response><Sms>Message received! Because it is the weekend, your case manager may take until the weekday to respond. Thanks for your patience.</Sms></Response>");
                    } else {
                      res.send("<?xml version='1.0' encoding='UTF-8'?><Response><Sms>Message received! Also, t's been over 4 hours and your case manager has not yet addressed your prior message so we sent them a reminder to get back to you!</Sms></Response>");
                      // notify the case manager now...
                    }
                  } else { sendEmptyRes(); }
                } catch (e) { sendEmptyRes(); }
              } else { sendEmptyRes(); }
            }).catch(function (err) { handleError(err); });
          }
        }).catch(function (err) { handleError(err); });
      }

      // log message being received
      var now = new Date(Date.now()).toISOString().split("T");
      console.log("Message received from " + from + " on " + now[0] + " at " + now[1]);

    }).catch(function (err) { handleError(err); });

    function sendEmptyRes () { 
      res.send("<?xml version='1.0' encoding='UTF-8'?><Response></Response>");
    };

    function handleError (err) {
      var now = new Date(Date.now()).toISOString().split("T");
      console.log("Error occurred on " + now[0] + " at " + now[1] + ": " + err);
      res.status(404).send(err);
      return false;
    };

  });

};
