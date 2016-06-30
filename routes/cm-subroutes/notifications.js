


// DEPENDENCIES
// Router
var express = require("express");
var router = express.Router({mergeParams: true});

// DB via knex.js to run queries
var db  = require("../../server/db");

// UTILITIES
var utils = require("../../utils/utils.js");

// Datetime management
var moment = require("moment");
var moment_tz = require("moment-timezone");

// Error handling
var errorHandlers = utils["errorHandlers"];
var fivehundred   = errorHandlers.fivehundred;


// CAPTURE BOARD OVERVIEW
router.get("/", function (req, res) { 
  // Reroute to unsent/incomplete notifications route view
  var redirectLoc = "/cms/" + req.params.cmid + "/notifications/overview/incomplete";
  res.redirect(redirectLoc);
});


// CAPTURE BOARD UNSENT NOTIFICATIONS
router.get("/overview/open", function (req, res) {
  var errorRedirect = fivehundred(res);
  
  db("notifications")
  .where("notifications.cm", req.user.cmid)
  .leftJoin("clients", "clients.clid", "notifications.client")
  .andWhere("sent", false)
  .andWhere("closed", false)
  .then(function (notifications) {

    db("orgs")
    .where("orgid", req.user.org)
    .then(function (org) {
      res.render("casemanagers/notifications/overview", {
        notifications: notifications, 
        org: org[0],
        archiveView: false
      });      
    })
    .catch(errorRedirect);

  })
  .catch(errorRedirect);
});


// CAPTURE BOARD SENT NOTIFICATIONS
router.get("/overview/closed", function (req, res) {
  var errorRedirect = fivehundred(res);

  db("notifications")
  .where("notifications.cm", req.user.cmid)
  .leftJoin("clients", "clients.clid", "notifications.client")
  .andWhere("sent", true)
  .andWhere("closed", true)
  .then(function (notifications) {

    db("orgs")
    .where("orgid", req.user.org)
    .then(function (org) {
      res.render("casemanagers/notifications/overview", {
        notifications: notifications, 
        org: org[0],
        archiveView: true
      });      
    })
    .catch(errorRedirect);

  })
  .catch(errorRedirect);
});


// GENERATE CAPTURE CARD SET
router.get("/new", function (req, res) {
  var errorRedirect = fivehundred(res);

  retrieveClientsAndClientContactMethods(req.user.cmid, function (clients) {
    if (clients) {
      res.render("casemanagers/notifications/parameters", { 
        notification: {},
        clients: clients
      });
    } else { errorRedirect(); }
  });
});

// PROCESS CAPTURE CARD PROGRESS
router.post("/new", function (req, res) { 
  var errorRedirect = fivehundred(res);
  var redirectLoc = "/cms/" + req.params.cmid + "/notifications";
  var n = req.body; // n for notification object

  // See if they are already in process of working through cards
  if (n.hasOwnProperty("sendDate")) {

    // Special request option to show a certain card in series
    // TO DO: Build out front end support for this, will happen w/ progress dots
    var cardRequested = n.showCardExplicit;

    // Figure out where in process the user is
    // Identity
    var cmid = Number(n.cmid);

    // Card 1 content
    var sendD =  n.sendDate;
    var sendTH = Number(n.sendTimeHour);
    var sendTM = Number(n.sendTimeMin);
    var clid =  Number(n.recipient);
    var sendC =  Number(n.recipientComm);

    // End card content
    var notiSubj = n.notiSubj;
    var notiCopy = n.notiCopy;

    // See if all variables have been added from this list
    var cardOneIncomplete  = (sendD == null) || (sendTH == null) || (sendTM == null) || (clid == null) || (sendC == null);
    var copyCardIncomplete = (notiSubj == "") || (notiCopy == "");

    // Validate all identity form components
    if (Number(req.user.cmid) !== cmid) {
      res.status(404).send("User ID does not match submitted cmid value");
      // TO DO: Make sure the cm has client actually
      // TO DO: Make sure that comm method is legal

    // Show first card if missing required data or if specifically requested
    } else if (cardRequested == 0 || cardOneIncomplete) {
      retrieveClientsAndClientContactMethods(req.user.cmid, function (clients) {
        if (clients) {
          res.render("casemanagers/notifications/parameters", { 
            notification: n,
            clients: clients
          });
        } else { errorRedirect(); }
      });

    // Show the notification text entry view
    // TO DO: Add support for selecting from templates in the future
    } else if (cardRequested == 1 || copyCardIncomplete) {
      res.render("casemanagers/notifications/copyEntry", { 
        notification: n,
      });      

    // Have everything we need, final submission
    } else {
      var sendTime = moment(sendD)
                      .add("hours",   sendTH)
                      .add("minutes", sendTM)
                      .format("YYYY-MM-DD HH:mm:ss");

      // In the future we need to support repeatable notifications
      // Database schema already supports
      db("notifications")
      .insert({
        cm:      cmid,
        client:  clid,
        comm:    sendC,
        subject: notiSubj,
        message: notiCopy,
        send:    sendTime
      })
      .then(function () {
        res.redirect(redirectLoc);
      })
      .catch(errorRedirect);
    }

  // Catchall: just start with first notification card
  } else {
    retrieveClientsAndClientContactMethods(req.user.cmid, function (clients) {
      if (clients) {
        res.render("casemanagers/notifications/parameters", { 
          notification: {},
          clients: clients
        });
      } else { errorRedirect(); }
    });
  }
});

// FOOBAR
router.get("/other", function (req, res) { 
  res.send("Goeeod")
});



// EXPORT ROUTER OBJECt
module.exports = router;



// UTILITY FUNCIONS
// TO DO: Move this stuff to a different file
function retrieveClientsAndClientContactMethods (cmid, cb) {
  var rawQuery =  " SELECT  commconns.client, clients.first, clients.last, " + 
                  "         commconns.name, comms.value, comms.commid " + 
                  "         FROM comms " + 
                  " LEFT JOIN commconns ON (commconns.comm = comms.commid) " +
                  " LEFT JOIN clients ON (commconns.client = clients.clid) " +
                  " LEFT JOIN cms ON (clients.cm = cms.cmid) " +
                  " WHERE cms.cmid = " + String(cmid) + "; ";

  db.raw(rawQuery).then(function (comms) {
    var clients = [];

    // Iterate through all results and fill out clients list
    comms.rows.forEach(function (row) {
      var name = [row.first, row.last].join(" ");
      var client = {
        name: name,
        id: row.client,
        comms: []
      }

      // Check if the client is already in list
      var alreadyExists = false;
      for (var i = 0; i < clients.length; i++) {
        if (row.client == clients[i].id) {
          alreadyExists = true;
        }
      }

      // Only add if that client is not already in
      if (!alreadyExists) { clients.push(client); }
    });

    // Now we need to add comms to each client object
    clients.forEach(function (client) {

      // Check through all rows
      comms.rows.forEach(function (row) {
        // If row is a match with client
        if (client.id == row.client) {
          // Create a new comm object
          var newComm = {
            name: row.name,
            value: row.value,
            id: row.commid
          };
          // And add it to the client's comms array
          client.comms.push(newComm);
        }
      });
    });

    // Return the cleaned object
    cb(clients);

  }).catch(function () { cb(false); });
}

















