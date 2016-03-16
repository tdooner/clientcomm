var twilio = require("twilio");
var sms = require("../utils/utils.js")["sms"];

module.exports = function (app, db, passport) {

  app.post("/test", function (req, res) {
    console.log(req.body)
  });

  app.post("/sms", function (req, res) {

    var twiml = new twilio.TwimlResponse();
    var from = sms.clean_from_val(req.body.From);
    var text = req.body.Body.trim();
    var tw_sid = req.body.SmsSid;
    var tw_status = req.body.SmsStatus;

    sms.get_or_create_comm_device(from)
    .then(function (device) {

      // if this communication device exists in the system already
      if (device.length > 0) {
        device = device[0];
        var commid = device.commid;

        // get clients
        sms.get_clients(commid)
        .then(function (clients) {

          // at least one client should be returned
          if (clients.length > 0) {
            sms.get_or_create_convos(clients)
            .then(function (convos) {

              // need to make sure that there are existing convos
              if (convos.length > 0) {
                sms.register_message(text, commid, convos)
                .then(function (msgs) {


                }).catch(function (err) {
                  handleError(err);
                });

              // convos list should have been returned
              } else {
                handleError("Failed to produce convos list.");
              }

            }).catch(function (err) {
              handleError(err);
            });

          // a client or null val should have been returned
          } else {
            handleError("Failed to produce client or null list value.");
          }

        }).catch(function (err) {
          handleError(err);
        });

      // that number does not currently exist
      } else {
        handleError("Failed to create a comm device.")
      } 
    }).catch(function (err) {
      handleError(err);
    });

    function handleError (err) {
      var now = new Date(Date.now()).toISOString()
      console.log("Error occurred at " + now + ": " + err);
      res.status(404).send(err);
      return false;
    };

  });

};
