module.exports = function (app, db, utils, passport) {

  app.post("/sms", function (req, res) {
    console.log("Hit SMS endpoint");

    var twiml = new utils.twilio.TwimlResponse();
    var from = req.body.From.replace(/\D+/g, "");
    var text = req.body.Body.trim();

    db("comms").where("value", from).limit(1).then(function (comms) {

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

      function logRes (msg) {
        console.log("Sending: " + msg);

        db("comms").where("value", from).then(function (comms) {
          if (msg.length > 255) {
            msg = msg.substr(0, 252) + "...";
          }
          for (var i = 0; i < comms.length; i++) {
            var new_resp = {
              comm: comms[i].commid,
              content: msg.substr(0, 255)
            };
            if (comms[i].client) { new_resp.client = comms[i].client; }
            db("msgs").insert(new_resp).then(function () { });
          }
        });
      }

      function responder (isNew) {
        text = text.toUpperCase();
        console.log("Received: " + text);
        console.log("Sess: " + JSON.stringify(req.session));

        // intro logic to sms toll if new
        if (text == "RESET") {
          var msg = "Acct state was reset.";
          twiml.sms(msg);
          logRes(msg);
          req.session.state = null;
          req.session.lost = false;
          res.send(twiml.toString());

        } else if (isNew) {
          var msg = "Welcome to ClientCOMM. Use this tool to manage your progress through the judicial system." + 
                    "Reply \"SEARCH\" to find your case, \"CJS\" contact your case manager, or \"MORE\" for assistance.";
          logRes(msg);
          twiml.sms(msg);
          req.session.state = "orientation";
          res.send(twiml.toString());

        } else if (!req.session.lost) {
          if (req.session.state == "orientation" && ["SEARCH"].indexOf(text) > -1) {
            var msg = "To get started send your name in the format FIRST MIDDLE LAST.";
            logRes(msg);
            twiml.sms(msg);
            req.session.lost = false;
            req.session.state = "method_name";
            res.send(twiml.toString());

          } else if (req.session.state == "method_name") {
            // clean up name
            var name = text.split(" ");
            var last = name[name.length - 1];
            var first = name[0];
            var query_name = last + "," + first;

            var msg = "Thanks, " + first + ". Please enter your date of birth in the format YEAR/MONTH/DAY using numbers only.";
            logRes(msg);
            twiml.sms(msg);
            req.session.name = query_name;
            req.session.state = "method_dob";
            res.send(twiml.toString());

          } else if (req.session.state == "method_dob") {

            if (!req.session.hasOwnProperty("name")) {
              var msg = "I didn't get your name. Send me your name in the format FIRST MIDDLE LAST.";
              logRes(msg);
              twiml.sms(msg);
              req.session.state = "method_name";
              res.send(twiml.toString());
            } else {
              // clean up name
              var name = req.session.name.split(",");
              var first = name[1];
              var last = name[0];

              // clean up date
              var dob = text.split(/[^0-9]/).filter(function (ea) { return ea !== ""; });
              var yr = dob[0];
              var mo = dob[1];
              var da = dob[2];

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
                console.log("d2", d);

                // stop gap measure for loading data - this should be get req
                var content = utils.fs.readFile("dummy.json", function (err, obj) {
                  obj = JSON.parse(obj);
                  obj.filter(function (ea) {
                    if (ea.defendant_birth_date == d) {
                      if (ea.defendant_last_name == last) {
                        if (ea.defendant_first_name.indexOf(first) > -1) {
                          return true;
                        }
                      }
                    }
                    return false;
                  });

                  if (obj.length > 0) {

                    // make this a likely match if only 1 result
                    if (obj.length == 1) {
                      db("comms").where("value", from).limit(1).then(function (comm) {
                        comm = comm[0];
                        db("clients").where("first", first).andWhere("last", last).andWhere("dob", d).then(function (cls) {
                          if (cls.length > 0) {
                            for (var i = 0; i < cls.length; i++) {
                              console.log("got one");
                              db("leads").insert({
                                cm: cl.cm,
                                comm: comm
                              });
                            };
                          }
                        });
                      });
                    }

                    var msg = "We found the following court dates: ";
                    var clean = [];
                    obj.forEach(function (ea) {
                      var ok = true;
                      clean.forEach(function (cl) {
                        if (cl.case_number == ea.case_number) ok = false;
                      });
                      if (ok) clean.push(ea);
                    });
                    clean.slice(0, 5).forEach(function (ea) {
                      msg += "Case " + ea.case_number + " on " + ea.appear_date + " at " + ea.appear_time + ". ";
                    });
                    msg += "If you need assistance, reply \"MORE\"."
                    twiml.sms(msg);
                    logRes(msg);
                    req.session.state = "method_help";
                    res.send(twiml.toString());
                  } else {
                    var msg = "I was unable to find any cases. Contact court or CJS for more information. " + 
                              "Reply \"SEARCH\" to find your case, \"CJS\" contact your case manager, or \"MORE\" for other options.";
                    logRes(msg);
                    twiml.sms(msg);
                    req.session.state = null;
                    res.send(twiml.toString());
                  }
                });
              } else {
                var msg = "Sorry, " + first + ", I don't understand. Enter your date of birth in format YEAR/MONTH/DAY, numbers only.";
                logRes(msg);
                twiml.sms(msg);
                req.session.name = query_name;
                req.session.state = "method_dob";
                res.send(twiml.toString());
              }
            }

          } else if (req.session.state == "method_help" || ["MORE", "ADDRESS", "CHARGES"].indexOf(text) > -1) {

            if (text == "MORE") {
              var msg = "Reply \"ADDRESS\", \"CHARGES\", \"CASE MANAGER\".";
              logRes(msg);
              twiml.sms(msg);
              req.session.state = "method_help";
              res.send(twiml.toString());

            } else if (text == "ADDRESS") {
              var msg = "Salt Lake County District Court is located at, Matheson Courthouse, 450 South State St, Salt Lake City. Reply \"ADDRESS\", \"CHARGES\", \"CASE MANAGER\".";
              logRes(msg);
              twiml.sms(msg);
              req.session.state = "method_help";
              res.send(twiml.toString());

            } else if (text == "CHARGES") {
              var msg = "USE OR POSSESSION OF DRUG PARAPHERNALIA, POSSESSION OR USE OF A CONTROLLED SUBSTANCE, POSSESSION OR USE OF A CONTROLLED SUBSTANCE, DRIVING UNDER THE INFLUENCE OF ALCOHOL/DRUGS,  INTERFERENCE WITH ARRESTING OFFICER. Reply \"ADDRESS\", \"CHARGES\", \"CASE MANAGER\".";
              logRes(msg);
              twiml.sms(msg);
              req.session.state = "method_help";
              res.send(twiml.toString());

            } else {
              var msg = "Criminal Justice Services has been alerted. A case manager will respond soon.";
              logRes(msg);
              twiml.sms(msg);
              req.session.lost = true;
              req.session.state = "method_name";
              res.send(twiml.toString());
            }

          } else {
            if (req.session.lost || ["MORE", "HUMAN", "CJS", "CASE MANAGER"].indexOf(text) > -1) {
              var msg = "Criminal Justice Services has been alerted. A case manager will respond soon.";
              logRes(msg);
              twiml.sms(msg);
              req.session.lost = true;
              req.session.state = null;
              res.send(twiml.toString());

            } else {
              var msg = "To get started send your name in the format FIRST MIDDLE LAST.";
              logRes(msg);
              twiml.sms(msg);
              req.session.lost = false;
              req.session.state = "method_name";
              res.send(twiml.toString());
            }
          }
        } else if (req.session.lost) {
          var msg = "You're message is in queue to be addressed.";
          logRes(msg);
          twiml.sms(msg);
          res.send(twiml.toString());
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
