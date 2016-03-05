module.exports = function (app, db, utils, passport) {

  app.post("/sms", function (req, res) {
    var twiml = new utils.twilio.TwimlResponse();
    var from = req.body.From.replace(/\D+/g, "");
    var text = req.body.Body.trim();

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
          db("msgs").insert(new_msg).then(function () { responder(true); });
        });

      // find existing users and add message to comm device
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
          db("msgs").insert(new_msg).then(function () { responder(false); });
        }
      }

      function responder (isNew) {
        text = text.toUpperCase();

        // intro logic to sms toll if new
        if (isNew) {
          twiml.sms("Welcome to ClientCOMM. Use this tool to manage your progress through the judicial system.
                    Reply \"SEARCH\" to find your case, \"CJS\" contact your case manager, or \"MORE\" for other options.");
          req.session.state = "orientation";
          res.send(twiml.toString());
        } else {
          if (req.session.state == "orientation" || ["SEARCH", "CJS", "MORE"].indexOf(text) > -1) {
            if (text == "SEARCH") {
              twiml.sms("To get started send your name in the format FIRST MIDDLE LAST.");
              req.session.state = "method_name";
              res.send(twiml.toString());
            } else {

            }

          } else if (req.session.state = "method_name") {
            // clean up name
            var name = text.split(" ");
            var last = text[text.length - 1];
            var first = text[0];
            var query_name = last + ", " + first;

            twiml.sms("Thanks, " + first + ". Please enter your date of birth in the format MONTH/DAY/YEAR using numbers only.");
            req.sesssion.name = query_name;
            req.session.state = "method_dob";
            res.send(twiml.toString());

          } else if (req.session.state = "method_dob") {
            // clean up name
            var dob = text.split(/[^0-9]/).filter(function (ea) { return ea !== ""; });
            var mo = dob[0];
            var da = dob[1];
            var yr = dob[2];

            var ok = true;
            if (mo == undefined) ok = false;
            if (da == undefined) ok = false;
            if (yr == undefined) ok = false;
            if (!(mo.length == 1 || mo.length == 2)) ok == false;
            if (!(da.length == 1 || da.length == 2)) ok == false;
            if (!(yr.length == 2 || yr.length == 4)) ok = false;
            if (!(Number(mo) > 0 && Number(mo) < 13)) ok = false;
            if (!(Number(da) > 0 && Number(da) < 32)) ok = false;
            if (!(Number(yr) > 1900 && Number(yr) < 2020)) ok = false;

            if (ok) {
              // create year
              if (yr.length == 2) yr = "19" + yr;
              mo = String(Number(mo) - 1);

              var d = yr + "-" + mo + "-" + da;

              twiml.sms("Thanks, " + first + ". Please enter your date of birth in the format MONTH/DAY/YEAR using numbers only.");
              req.sesssion.name = query_name;
              req.session.state = "method_name";
              res.send(twiml.toString());

            } else {
              twiml.sms("Sorry, " + first + ", I don't understand. Enter your date of birth in format MONTH/DAY/YEAR, numbers only.");
              req.sesssion.name = query_name;
              req.session.state = "method_dob";
              res.send(twiml.toString());
            }

          } else {
            twiml.sms("To get started send your name in the format FIRST MIDDLE LAST.");
            req.session.state = "method_name";
            res.send(twiml.toString());
          }
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
