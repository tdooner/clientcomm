var db = require("../server/db");

var credentials = require("../credentials");
var ACCOUNT_SID = credentials.accountSid;
var AUTH_TOKEN = credentials.authToken;
var TWILIO_NUM = credentials.twilioNum;

var twilio = require("twilio");
var twClient = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);

var pass = require("../utils/utils.js")["pass"];
var sms = require("../utils/utils.js")["sms"];
var cmview = require("../utils/utils.js")["cmview"];
var isLoggedIn = pass.isLoggedIn;


module.exports = function (app, passport) {

	// view current clients for a case manager
  app.get("/cms", isLoggedIn, function (req, res) { 
    if (req.user.superuser) {
      res.redirect("/orgs");
    } else if (req.user.admin) {
      res.redirect("/admin");
    } else {
      var cmid = req.user.cmid;
      res.redirect("/cms/" + cmid);
    }
  });

  app.get("/cms/:cmid", isLoggedIn, function (req, res) { 
    var cmid = req.params.cmid;

    db("cms").where("cmid", cmid).limit(1)
    .then(function (cms) {

      // if no results, this client does not exist
      if (cms.length == 0) {
        res.redirect("/404");

      } else {
        var cm = cms[0];
        var thisIsUser = req.user.cmid == cmid;
        var adminView = (req.user.cmid !== cmid) && (req.user.org == cm.org);

        // user trying to view their own profile
        if (thisIsUser) {
          var rawQuery = "SELECT count(CASE WHEN msgs.read THEN 1 ELSE NULL END) AS msg_ct, clients.* FROM clients ";
          rawQuery += "LEFT JOIN convos ON (convos.client=clients.clid) ";
          rawQuery += "LEFT JOIN msgs ON (msgs.convo=convos.convid) ";
          rawQuery += "WHERE clients.cm=" + req.user.cmid + " ";
          rawQuery += "GROUP BY clients.clid;";
          
          db.raw(rawQuery).then(function (clients) {

            res.render("clients", {
              cm: cm,
              clients: clients.rows,
            });

          }).catch(function (err) { res.redirect("/500"); });

        // admin trying to view one of his staff's profiles
        } else if (adminView) {
          res.redirect("/admin/cms/" + cmid);

        // no view permissions
        } else {
          res.redirect("/401");
        }


      }
    }).catch(function (err) { res.redirect("/500"); })
    
  });

  
  app.post("/cms/:cmid", isLoggedIn, function (req, res) { 
    var redirect_loc = "/cms/" + req.params.cmid;

    var cmid = req.body.cmid;
    var first = req.body.first;
    var middle = req.body.middle;
    var last = req.body.last;
    var dob = req.body.dob;
    var otn = req.body.otn;
    var so = req.body.so;

    if (!middle) middle = "";
    if (!otn) otn = null;
    if (!so) so = null;

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
    var clid = Number(req.params.clid);
    var cmid = Number(req.user.cmid);
    db("clients").where("clid", clid).limit(1)
    .then(function (cls) {
      var cl = cls[0];
      if (cmid == Number(cl.cm) && cmid == Number(req.params.cmid)) {

        db("convos")
        .where("convos.cm", cmid)
        .andWhere("convos.client", clid)
        .orderBy("convos.updated", "desc")
        .then(function (convos) {

          db("comms").innerJoin("commconns", "comms.commid", "commconns.comm")
          .where("commconns.client", cl.clid)
          .then(function (comms) {

            res.render("client", {
              cm: req.user,
              cl: cl,
              comms: comms,
              convos: convos,
            });
            
          }).catch(function (err) {
            res.redirect("/500");
          })

        }).catch(function (err) {
          res.redirect("/500");
        })

      } else {
        console.log(cl.cm , cmid , cmid , req.params.cmid)
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

    if (type == "cell" || type == "landline") {
      value = value.replace(/[^0-9.]/g, "");
      if (value.length == 10) {
        value = "1" + value;
      }
    }

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
      
      db("comms").where("value", value).limit(1)
      .then(function (comms) {

        if (comms.length > 0) {
          var commid = comms[0].commid;

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

      }).catch(function (err) {
        res.redirect("/500");
      })

    }
  });

  app.post("/cms/:cmid/cls/:clid/close", isLoggedIn, function (req, res) { 
    var redirect_loc = "/cms/" + req.user.cmid;

    var clid = req.params.clid;
    var cmid = req.params.cmid;

    if (Number(cmid) !== Number(req.user.cmid)) {
      req.flash("warning", "Case Manager ID does not match user logged-in.");
      res.redirect(redirect_loc);
    } else {
      
      db("clients").where("clid", clid).limit(1)
      .then(function (clients) {

        if (clients.length > 0) {
          var client = clients[0];

          if (client.cm == cmid) {

            db("clients").where("clid", clid)
            .update({active: false})
            .then(function (success) {
              req.flash("success", "Closed out client" + client.first + " " + client.last + ".");
              res.redirect(redirect_loc);

            }).catch(function (err) {
              console.log(err);
              res.redirect("/500");
            });

          } else {
            req.flash("warning", "You do not have authority to close that client.");
            res.redirect(redirect_loc);
          }

        } else {
          req.flash("warning", "That user id does not exist.");
          res.redirect(redirect_loc);
        }

      }).catch(function (err) {
        res.redirect("/500");
      })

    }
  });

  app.post("/cms/:cmid/cls/:clid/convos", isLoggedIn, function (req, res) {
    var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid;

    var cmid = req.body.cmid;
    var clid = req.body.clid;
    var subject = req.body.subject;

    if (Number(cmid) !== Number(req.user.cmid)) {
      req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
      res.redirect(redirect_loc);
    } else {

      db("convos")
      .where("client", clid)
      .andWhere("cm", cmid)
      .andWhere("convos.open", true)
      .pluck("convid")
      .then(function (convos) {
        
        db("convos").whereIn("convid", convos)
        .update({
          open: false,
          updated: db.fn.now()
        }).then(function (success) {
          
          db("convos")
          .insert({
            cm: cmid,
            client: clid,
            subject: subject,
            open: true,
            accepted: true
          }).then(function (success) {
            req.flash("success", "New conversation created.");
            res.redirect(redirect_loc);
          }).catch(function (err) {
            console.log(err);
            res.redirect("/500");
          });

        }).catch(function (err) {
          res.redirect("/500");
        })

      }).catch(function (err) {
        res.redirect("/500");
      })

    }
  });

  app.get("/cms/:cmid/cls/:clid/convos/:convid", isLoggedIn, function (req, res) {
    var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid + "/convos/" + req.params.convid;

    var cmid = req.params.cmid;
    var clid = req.params.clid;
    var convid = req.params.convid;

    if (Number(cmid) !== Number(req.user.cmid)) {
      req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
      res.redirect(redirect_loc);
    } else {

      cmview.get_convo(cmid, clid, convid)
      .then(function (obj) {
        obj.warning = req.flash("warning");
        obj.success = req.flash("success");
        obj.cm = req.user;

        res.render("msgs", obj);

      }).catch(function (err) {
        if (err == "404") {
          res.redirect("/404");
        } else {
          res.redirect("/500");
        }
      })

    }
  });

  app.post("/cms/:cmid/cls/:clid/convos/:convid", isLoggedIn, function (req, res) {
    var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid + "/convos/" + req.params.convid;

    var cmid = req.params.cmid;
    var clid = req.params.clid;
    var convid = req.params.convid;

    var commid = req.body.commid;
    var content = req.body.content;

    if (Number(cmid) !== Number(req.user.cmid)) {
      req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
      res.redirect("/cms/" + req.user.cmid);
    } else if (typeof content !== "string" || content == "") {
      req.flash("warning", "Text entry either too short or not of type string.");
      res.redirect(redirect_loc)
    } else if (typeof content == "string" && content.length > 160) {
      req.flash("warning", "Text entry is too long; limit is 160 characters.");
      res.redirect(redirect_loc)
    } else {
      content = content.trim().substr(0,159);

      db("comms")
      .where("commid", commid)
      .limit(1)
      .then(function (comms) {
        
        if (comms.length > 0) {
          var comm = comms[0];

          twClient.sendSms({
            to: comm.value,
            from: TWILIO_NUM,
            body: content
          }, function (err, msg) {
            if (err) {
              console.log('Oops! There was an error.', err);
            } else {
              db("msgs")
              .insert({
                convo: convid,
                comm: commid,
                content: content,
                inbound: false,
                read: true,
                tw_sid: msg.sid,
                tw_status: msg.status
              })
              .returning("msgid")
              .then(function (msgs) {

                db("convos").where("convid", convid)
                .update({updated: db.fn.now()})
                .then(function (success) {
                  req.flash("success", "Sent message.");
                  res.redirect(redirect_loc)

                }).catch(function (err) {
                  res.redirect("/500");
                })

              }).catch(function (err) {
                res.redirect("/500");
              });

            }
          });          
        } else {
          res.redirect("/404");
        }

      }).catch(function (err) {
        res.redirect("/500");
      })

    }
  });

  app.post("/cms/:cmid/cls/:clid/convos/:convid/close", isLoggedIn, function (req, res) {
    var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid + "/convos/" + req.params.convid;

    var cmid = req.params.cmid;
    var clid = req.params.clid;
    var convid = req.params.convid;

    if (Number(cmid) !== Number(req.user.cmid)) {
      req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
      res.redirect(redirect_loc);
    } else {

      cmview.get_convo(cmid, clid, convid)
      .then(function (obj) {
        
        db("convos").where("convid", convid).update({open: false, updated: db.fn.now()})
        .then(function (success) {
          req.flash("success", "Closed conversation.");
          res.redirect(redirect_loc);

        }).catch(function (err) {
          res.redirect("/500");
        })

      }).catch(function (err) {
        if (err == "404") {
          res.redirect("/404");
        } else {
          res.redirect("/500");
        }
      })

    }
  });

  app.post("/cms/:cmid/cls/:clid/convos/:convid/accept", isLoggedIn, function (req, res) {
    var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid + "/convos/" + req.params.convid;

    var cmid = req.params.cmid;
    var clid = req.params.clid;
    var convid = req.params.convid;

    if (Number(cmid) !== Number(req.user.cmid)) {
      req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
      res.redirect(redirect_loc);
    } else {

      cmview.get_convo(cmid, clid, convid)
      .then(function (obj) {
        
        db("convos").where("convid", convid).update({accepted: true, updated: db.fn.now()})
        .then(function (success) {
          req.flash("success", "Closed conversation.");
          res.redirect(redirect_loc);

        }).catch(function (err) {
          res.redirect("/500");
        })

      }).catch(function (err) {
        if (err == "404") {
          res.redirect("/404");
        } else {
          res.redirect("/500");
        }
      })

    }
  });


  app.post("/cms/:cmid/cls/:clid/convos/:convid/reject", isLoggedIn, function (req, res) {
    var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid;

    var cmid = req.params.cmid;
    var clid = req.params.clid;
    var convid = req.params.convid;

    if (Number(cmid) !== Number(req.user.cmid)) {
      req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
      res.redirect(redirect_loc);
    } else {
      
      db("msgs").where("convo", convid).delete()
      .then(function (success) {

        db("convos").where("convid", convid).delete()
        .then(function (success) {
          req.flash("success", "Closed conversation.");
          res.redirect(redirect_loc);

        }).catch(function (err) {
          console.log("2", err);
          res.redirect("/500");
        })

      }).catch(function (err) {
        console.log("1", err);
        res.redirect("/500");
      })

    }
  });



};
