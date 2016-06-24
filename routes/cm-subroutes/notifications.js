


// DEPENDENCIES
// Router
var express = require("express");
var router = express.Router({mergeParams: true});

// DB via knex.js to run queries
var db  = require("../../server/db");

// UTILITIES
var utils = require("../../utils/utils.js");

// Error handling
var errorHandlers = utils["errorHandlers"];
var fivehundred   = errorHandlers.fivehundred;


// GENERATE CAPTURE BOARD
router.get("/", function (req, res) { 
  res.send("ddd");
});

// GENERATE CAPTURE CARD SET
router.get("/new", function (req, res) {
  var errorRedirect = fivehundred(res);

  retrieveClientsAndClientContactMethods(req.user.cmid, function (clients) {
    if (clients) {
      res.render("casemanagers/notifications/parameters", { 
        notification: {
          recipient: 154,
          recipientComm: 174
        },
        clients: clients
      });
    } else { errorRedirect(); }
  });
});

// PROCESS CAPTURE CARD PROGRESS
router.post("/new", function (req, res) { 
  var errorRedirect = fivehundred(res);
  var baseRedirect = "/cms/" + req.params.cmid + "/notifications";
  var q = req.body;

  // See if they are already in process of working through cards
  if (q.hasOwnProperty("notification")) {
    var n = q.notification;

    // Convert potential string values to integers where applicable
    if (n.sendTimeHour) n.sendTimeHour = Number(n.sendTimeHour);
    if (n.sendTimeMin)  n.sendTimeMin  = Number(n.sendTimeMin);

    // Special request option to show a certain card in series
    var cardRequested = n.showCardExplicit;

    // Figure out where in process the user is
    var sendD =  n.sendDate;
    var sendTH = n.sendTimeHour;
    var sendTM = n.sendTimeMin;
    var sendR =  n.recipient;
    var sendC =  n.recipientComm;

    // See if all variables have been added from this list
    var cardOneIncomplete = (sendD == null) || (sendTH == null) || (sendTM = null) || (sendR == null) || (sendC == null);

    // Show first card if missing required data or if specifically requested
    if (cardRequested == 0 || !cardOneIncomplete) {
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
    } else {
      retrieveClientsAndClientContactMethods(req.user.cmid, function (clients) {
        if (clients) {
          res.render("casemanagers/notifications/copyEntry", { 
            notification: n,
            clients: clients
          });
        } else { errorRedirect(); }
      });
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

















