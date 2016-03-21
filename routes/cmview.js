var db = require("../server/db");

var credentials = require("../credentials");
var ACCOUNT_SID = credentials.accountSid;
var AUTH_TOKEN = credentials.authToken;
var TWILIO_NUM = credentials.twilioNum;

var pass = require("../utils/utils.js")["pass"];
var isLoggedIn = pass.isLoggedIn;


module.exports = function (app, passport) {

	// view current clients for a case manager
  app.get("/cms", isLoggedIn, function (req, res) { 
    var cmid = req.user.cmid;
    var redirect_loc = "/cms/" + cmid;
    res.redirect(redirect_loc);
  });

  app.get("/cms/:cmid", isLoggedIn, function (req, res) { 
    var cmid = req.user.cmid;

    db("cms").where("cmid", cmid).limit(1)
    .then(function (cms) {
      if (cms.length == 0) {
        res.redirect("/404");
      } else {
        if (cms[0].active) {
          db("clients").where("cm", cmid)
          .then(function (clients) {

            var warning = req.flash("warning");
            var success = req.flash("success");

            res.render("clients", {
              cm: cms[0],
              clients: clients,
              warning: warning,
              success: success
            });

          }).catch(function (err) {
            res.redirect("/500");
          });
        } else {
          res.redirect("/404");
        }
      }
    }).catch(function (err) {
      res.redirect("/500");
    })
    
  });

  
  app.post("/cms/:cmid", isLoggedIn, function (req, res) { 
    var redirect_loc = "/cms";

    var cmid = req.body.cmid;
    var first = req.body.first;
    var middle = req.body.middle;
    var last = req.body.last;
    var dob = req.body.dob;
    var otn = req.body.otn;
    var so = req.body.so;

    if (!middle) middle = "";

    if (!cmid) {
      req.flash("warning", "Missing cmid.");
      res.redirect(redirect_loc);
    } else if (Number(req.user.cmid) !== Number(cmid)) {
      req.flash("warning", "This ID does not match with the logged-in user");
      res.redirect(redirect_loc);
    } else if (!first) {
      req.flash("warning", "Missing first name.");
      res.redirect(redirect_loc);
    } else if (!last) {
      req.flash("warning", "Missing last name.");
      res.redirect(redirect_loc);
    } else if (isNaN(Date.parse(dob))) {
      req.flash("warning", "Missing date of birth.");
      res.redirect(redirect_loc);
    } else if (!otn) {
      req.flash("warning", "Missing OTN.");
      res.redirect(redirect_loc);
    } else if (!so) {
      req.flash("warning", "Missing SO number.");
      res.redirect(redirect_loc);
    } else {
      db("clients")
      .insert({
        cm: cmid,
        first: first,
        middle: middle,
        last: last,
        dob: dob,
        otn: otn,
        so: so,
        active: true
      }).then(function (success) {
        req.flash("success", "Added a new client.");
        res.redirect(redirect_loc);
      }).catch(function (err) {
        res.redirect("/500")
      })
    }
    
  });

  app.get("/cms/:cmid/cls", isLoggedIn, function (req, res) { 
    res.redirect("/cms");
  });

  app.get("/cms/:cmid/cls/:clid", isLoggedIn, function (req, res) { 
    var clid = req.params.clid;
    var cmid = req.user.cmid;
    db("clients").where("clid", clid).limit(1)
    .then(function (cls) {
      var cl = cls[0];
      if (cl.cm == cmid && cmid == req.params.cmid) {

        db("convos")
        .where("convos.cm", cmid)
        .andWhere("convos.client", clid)
        .orderBy("convos.updated", "desc")
        .then(function (convos) {

          db("comms").innerJoin("commconns", "comms.commid", "commconns.comm")
          .where("commconns.client", cl.clid)
          .then(function (comms) {

            var warning = req.flash("warning");
            var success = req.flash("success");

            res.render("client", {
              cm: req.user,
              cl: cl,
              comms: comms,
              convos: convos,
              warning: warning,
              success: success
            });
            
          }).catch(function (err) {
            res.redirect("/500");
          })

        }).catch(function (err) {
          res.redirect("/500");
        })

      } else {
        res.redirect("/404");
      }
    }).catch(function (err) {
      res.redirect("/500");
    })
  });


  app.post("/cms/:cmid/cls/:clid/comm", isLoggedIn, function (req, res) { 
    var redirect_loc = "/cms/" + req.user.cmid;

    var clid = req.params.clid;
    var cmid = req.user.cmid;
    var type = req.body.type;
    var value = req.body.value;
    var description = req.body.description;

    console.log("type is: ", type);
    if (type == "cell" || type == "landline") {
      value = value.replace(/[^0-9.]/g, "");
      if (value.length == 10) {
        value = "1" + value;
      }
      console.log("value is: ", value);
    }
    console.log("value 2 is: ", value);

    if (Number(clid) !== Number(req.body.clid)) {
      req.flash("warning", "Client ID does not match.");
      res.redirect(redirect_loc);
    } else if (Number(cmid) !== Number(req.body.cmid)) {
      req.flash("warning", "Case Manager ID does not match user logged-in.");
      res.redirect(redirect_loc);
    } else if (!type) {
      req.flash("warning", "Missing the communication type.");
      res.redirect(redirect_loc);
    } else if (!value) {
      req.flash("warning", "Missing the communication value (e.g. the phone number).");
      res.redirect(redirect_loc);
    } else if (type == "cell" && value.length !== 11) {
      req.flash("warning", "Incorrect phone value.");
      res.redirect(redirect_loc);
    } else if (!description) {
      req.flash("warning", "Missing description value.");
      res.redirect(redirect_loc);
    } else {
      db("comms").insert({
        type: type,
        value: value,
        description: description
      }).returning("commid")
      .then(function (commids) {
        var commid = commids[0];

        db("commconns").insert({
          client: clid,
          comm: commid,
          name: description
        })
        .then(function (success) {
          req.flash("success", "Added a new communication method.");
          res.redirect(redirect_loc);

        }).catch(function (err) {
          res.redirect("/500");
        })

      }).catch(function (err) {
        res.redirect("/500");
      })
    }
  });

  app.get("/cms/:cmid/cls/:clid/convos/:convid", isLoggedIn, function (req, res) {
    var redirect_loc = "/cms/" + req.user.cmid;

    var cmid = req.params.cmid;
    var clid = req.params.clid;
    var convid = req.params.convid;

    if (Number(cmid) !== Number(req.user.cmid)) {
      req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
      res.redirect(redirect_loc);
    } else {

      db("clients").where("clid", clid).limit(1)
      .then(function (clients) {

        if (clients.length > 0) {
          var client = clients[0];  

          if (client.cm == cmid) {

            db("convos").where("convid", convid).limit(1)
            .then(function (convos) {

              if (convos.length > 0) {
                var convo = convos[0];  

                if (convo.cm == cmid) {

                  db.select("msgs.content", "msgs.inbound", "msgs.read", "msgs.tw_status", "msgs.created", "comms.type", "comms.value", "comms.description")
                  .from("msgs")
                  .innerJoin("comms", "comms.commid", "msgs.comm")
                  .where("msgs.convo", convid)
                  .then(function (msgs) {
                    res.render("msgs", {
                      cm: req.user,
                      cl: client,
                      convo: convo,
                      msgs: msgs,
                    });

                  }).catch(function (err) {
                    res.redirect("/500")
                  })

                } else {
                  // actually not allowed to view
                  res.redirect("/404");
                }

              } else {
                // actually not allowed to view
                res.redirect("/404");
              }
            });

          } else {
            res.redirect("/404");
          }

        } else {
          res.redirect("/404");
        }

      }).catch(function (err) {
        res.redirect("/500");
      })

    }
  });


};
