


// SECRET STUFF
var credentials = require("../../credentials");
var ACCOUNT_SID = credentials.accountSid;
var AUTH_TOKEN = credentials.authToken;
var TWILIO_NUM = credentials.twilioNum;

// DEPENDENCIES
// Router
var express = require("express");
var router = express.Router({mergeParams: true});

// DB via knex.js to run queries
var db  = require("../../server/db");

// Twilio tools
var twilio = require("twilio");
var twClient = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);

// UTILITIES
var utils = require("../../utils/utils.js");

// Models
const Convo = require('../../models/models').Convo
const Message = require('../../models/models').Message
const Communication = require('../../models/models').Communication

// Query tools
var sms = utils["sms"];
var cmview = utils["cmview"];

// Session status control
var auth = utils["pass"];

// Error handling
var errorHandlers = utils["errorHandlers"];
var fivehundred   = errorHandlers.fivehundred;




router.get("/", function (req, res) {
  
  // Reroute
  var errorRedirect = fivehundred(res);
  
  // Parameters
  var clid = Number(req.params.clid);
  var cmid = Number(req.params.cmid);
  var cmid2 = Number(req.user.cmid);

  if (cmid !== cmid2) { 
    res.redirect("/400"); 
  
  } else { 
    db("clients")
    .where("cm", cmid)
    .andWhere("clid", clid)
    .then(function (clients) {

      // Make sure that client with that cm actually exists
      if (clients.length == 0) { 
        res.redirect("/404"); 

      // Then proceed to gather current conversations
      } else { 
        db("comms")
        .innerJoin("commconns", "comms.commid", "commconns.comm")
        .where("commconns.client", clid)
        .then(function (comms) {

          res.render("casemanagers/client/clientconvo", {
            client: clients[0], 
            comms: comms
          });
          
        }).catch(errorRedirect);
      } 
    }).catch(errorRedirect);
  }
});



router.post("/", function (req, res) {
  
  // Reroute
  var errorRedirect = fivehundred(res);
  var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid;

  var cmid = req.body.cmid;
  var clid = req.body.clid;
  var subject = req.body.subject;
  var content = req.body.content;
  var commid = req.body.commid;

  if (Number(cmid) !== Number(req.user.cmid)) {
    req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
    res.redirect(redirect_loc);
  } else {

    var newConvoId;

    Convo.closeAll(cmid, clid)
    .then(() => {
      return Convo.create(cmid, clid, subject, true)
    }).then((convoId) => {
      newConvoId = convoId
      return Communication.findById(commid)
    }).then((communication) => {
      twClient.sendSms({
        to: communication.value,
        from: TWILIO_NUM,
        body: content,
      }, (err, msg) => {
        if (err) {
          console.log("Twilio send error: ", err);
          if (err.hasOwnProperty("code") && err.code == 21211) {
            res.status(500).send("That number is not a valid phone number.")
          } else {
            res.redirect("/500");
          }
        } else {
          Message.create({
            convo: newConvoId,
            comm: commid,
            content: content,
            inbound: false,
            read: true,
            tw_sid: msg.sid,
            tw_status: msg.status,
          })
          .then((messageId) => {
            req.flash("success", "New conversation created.");
            redirect_loc = redirect_loc + "/convos/" + newConvoId;
            res.redirect(redirect_loc);
          }).catch(errorRedirect);
        }
      })
    }).catch(errorRedirect);
  }
});

router.get("/:convid", function (req, res) {
  // Reroute
  var errorRedirect = fivehundred(res);
  var redirect_loc = "/cms/" + req.params.cmid + "/cls/" + req.params.clid + "/convos/" + req.params.convid;

  var cmid = req.params.cmid;
  var clid = req.params.clid;
  var convid = req.params.convid;

  if ((Number(cmid) !== Number(req.user.cmid)) && !req.user.superuser) {
    req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
    res.redirect(redirect_loc);

  } else {
    cmview.getConvo(cmid, clid, convid)
    .then(function (obj) {

      var rawQuery = "UPDATE msgs SET read = TRUE WHERE msgid IN ( ";
      rawQuery += "SELECT msgs.msgid FROM clients ";
      rawQuery += "LEFT JOIN convos ON (convos.client=clients.clid) ";
      rawQuery += "LEFT JOIN msgs ON (msgs.convo=convos.convid) ";
      rawQuery += "WHERE clients.cm=" + cmid  + " AND clients.clid=" + clid + " AND msgs.read=FALSE) ";

      db.raw(rawQuery).then(function (success) {

        db("clients").where("clid", clid).limit(1).then(function (cls) {
          obj.client = cls[0];
          res.render("casemanagers/client/msgs", obj);
        }).catch(errorRedirect);

      }).catch(errorRedirect);

    }).catch(function (err) {
      if (err == "404") { 
        res.redirect("/404"); 
      } else { 
        res.redirect("/500"); 
      }
    })

  }
});


router.post("/:convid", function (req, res) {
  
  // Reroute
  var errorRedirect = fivehundred(res);
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

    Communication.findById(commid)
    .then((communication) => {
      if (communication) {
        twClient.sendSms({
          to: communication.value,
          from: TWILIO_NUM,
          body: content,
        }, function (err, msg) {
          if (err) {
            console.log("Twilio send error: ", err);
            if (err.hasOwnProperty("code") && err.code == 21211) res.status(500).send("That number is not a valid phone number.");
            else res.redirect("/500");
          } else {
            Message.create({
              convo: convid,
              comm: commid,
              content: content,
              inbound: false,
              read: true,
              tw_sid: msg.sid,
              tw_status: msg.status,
            })
            .then((messageId) => {
              db("convos").where("convid", convid)
              .update({updated: db.fn.now()})
              .then(function (success) {
                req.flash("success", "Sent message.");
                res.redirect(redirect_loc)
              }).catch(errorRedirect);
            }).catch(errorRedirect);
          }
        });
      } else {
        res.redirect("/404")
      }
    }).catch(errorRedirect);
  }
});

router.post("/:convid/close", function (req, res) {
  
  // Reroute
  var errorRedirect = fivehundred(res);
  var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid + "/convos/" + req.params.convid;

  var cmid = req.params.cmid;
  var clid = req.params.clid;
  var convid = req.params.convid;

  if (Number(cmid) !== Number(req.user.cmid)) {
    req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
    res.redirect(redirect_loc);
  } else {

    cmview.getConvo(cmid, clid, convid)
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

router.post("/:convid/open", function (req, res) {
  
  // Reroute
  var errorRedirect = fivehundred(res);
  var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid + "/convos/" + req.params.convid;

  var cmid = req.params.cmid;
  var clid = req.params.clid;
  var convid = req.params.convid;

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
      .update({ open: false })
      .then(function (success) {

        cmview.getConvo(cmid, clid, convid)
        .then(function (obj) {
          
          db("convos").where("convid", convid).update({open: true, updated: db.fn.now()})
          .then(function (success) {
            req.flash("success", "Conversation reopened.");
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
        });

      }).catch(errorRedirect);
    }).catch(errorRedirect);
  }
});

router.post("/:convid/accept", function (req, res) {
  
  // Reroute
  var errorRedirect = fivehundred(res);
  var redirect_loc = "/cms/" + req.user.cmid + "/cls/" + req.params.clid + "/convos/" + req.params.convid;

  var cmid = req.params.cmid;
  var clid = req.params.clid;
  var convid = req.params.convid;

  if (Number(cmid) !== Number(req.user.cmid)) {
    req.flash("warning", "Mixmatched user cmid and request user cmid insert.");
    res.redirect(redirect_loc);
  } else {

    cmview.getConvo(cmid, clid, convid)
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


router.post("/:convid/reject", function (req, res) {
  
  // Reroute
  var errorRedirect = fivehundred(res);
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

      }).catch(errorRedirect);

    }).catch(errorRedirect);

  }
});

router.use(function (req, res, next) {
  console.log("hee", req.params);
  next();
});

// EXPORT ROUTER OBJECt
module.exports = router;



// UTILITY FUNCIONS














