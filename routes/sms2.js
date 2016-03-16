var twilio = require("twilio");
var sms = require("../utils/utils.js")["sms"];

module.exports = function (app, db, passport) {

  app.post("/sms", function (req, res) {

    var twiml = new twilio.TwimlResponse();
    var from = sms.clean_from_val(req.body.From);
    var text = req.body.Body.trim();

    sms.check_if_comm_device_exists(from)
    .then(function (device) {

      // if this communication device exists in the system already
      if (device.length > 0) {
        device = device[0];
        var commid = device.commid;

        // get clients
        sms.get_related_clients(commid)
        .then(function (clients) {
          sms.retrieve_convos(clients);

        }).catch(function (err) {
          handleError(err);
        });

      // that number does not currently exist
      } else {
        sms.create_new_device(from)
        .then(function (commid) {
          register_message(commid, [null]);

        }).catch(function (err) {
          handleError(err);
        });
      } 
    }).catch(function (err) {
      handleError(err);
    });

    function retrieve_convos (commid, clients) {

    };

    function handleError (err) {
      console.log(err);
      res.status(404).send(err)
    };

  });

};
