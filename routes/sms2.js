module.exports = function (app, db, utils, passport) {

  app.post("/sms", function (req, res) {
    console.log("Hit SMS endpoint");

    var twiml = new utils.twilio.TwimlResponse();
    var from = req.body.From.replace(/\D+/g, "");
    var text = req.body.Body.trim();

    db("comms").where("value", from).limit(1).then(function (comm) {
      // acquire commid
      if (comm.length > 0) {
        // take first item from list
        comm = comm[0];

        // get all potential client ids
        db("commconns").whereNotNull("retired")
        .andWhere("comm", comm.commid).then(function (commconns) {

          // there are clients with this number
          if (commconns.length > 0) {
            for (var i = 0; i < commconns.length; i++) {
              db("convos").where("current", true)
              .andWhere("").then(function {});
            }

          // there are no clients linked to that number
          } else {

          }
        });


      // that number does not currently exist
      } else {

      }

    });

  });

};
