module.exports = function (app, db, utils, passport) {

  app.post("/sms", function (req, res) {
    var twiml = new utils.twilio.TwimlResponse();
    var from = req.body.From.replace(/\D+/g, "");
    var text = req.body.Body.trim();

    console.log(from)
    console.log(text)

    db("comms").where("value", from).then(function (comms) {
      // create a "hanging" account if a user is unknown
      if (comms.length == 0) {
        var new_cell = {
          type: "cell",
          value: from
        };
        db("comms").insert(new_cell).returning("commid").then(function (commid) {
          var new_msg = {
            comm: commid[0],
            content: text,
            inbound: true,
            tw_sid: req.body.SmsSid,
            tw_status: req.body.SmsStatus
          };
          db("msgs").insert(new_msg).then(function () { console.log("Done 1") });
        });
      } else {
        for (var i = 0; i < comms.length; i++) {
          var new_msg = {
            client: comms[i].client,
            comm: comms[i].commid,
            content: text,
            inbound: true,
            tw_sid: req.body.SmsSid,
            tw_status: req.body.SmsStatus
          };
          console.log(new_msg);
          db("msgs").insert(new_msg).then(function () {
            console.log("Done 2")
          });
        }
      }
    });

  });

  app.get("/floaters/",  function (req, res) {
    db("comms").where("client", null).then(function (comms) {
      res.render("floaters", {comms: comms})
    });
  });

};
