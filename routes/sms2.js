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
        db("commconns")
        .innerJoin("convos", "commconns.client", "convos.client")
        .innerJoin("clients", "commconns.client", "clients.clid")
        .innerJoin("cms", "cms.cmid", "clients.cm")
        .whereNotNull("commconns.retired")
        .andWhere("commconns.comm", comm.commid)
        .andWhere("convos.current", true)
        .then(function (commconns) {

          // there are clients with this number
          if (commconns.length > 0) {
            commconns

            for (var i = 0; i < commconns.length; i++) {
              var client = commconns[i].client;

              db("convos").where("current", true)
              .andWhere("client", client).limit(1).then(function (convo) {

                if (convos.length > 0) {
                  convo = convo[0];

                  db("clients").where("clid", convo.client).limit(1).then(function (client) {
                    if (client.length > 0) {
                      client = client[0];

                      db("cms").where("cmid", client.cm).limit(1).then(function (cm) {
                        if (cm.length > 0) {
                          cm = cm[0];
                          sms(req, res, convo, client, cm)

                        // no case maanger
                        } else {
                          sms(req, res, convo, client, null)
                        }
                      });

                    // error, missing client connected data
                    } else {

                    }
                   });


                // no current convo, create a new one
                } else {

                }

              });
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

  function sms (req, res, client, cm) {

  }

};
