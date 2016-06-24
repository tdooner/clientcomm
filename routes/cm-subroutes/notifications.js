


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
  res.render("casemanagers/notifications/parameters", { notification: {} });
});

// PROCESS CAPTURE CARD PROGRESS
router.post("/new", function (req, res) { 
  var errorRedirect = fivehundred(res);
  var baseRedirect = "/cms/" + req.params.cmid + "/notifications";
  var q = req.query;

  // See if they are already in process of working through cards
  if (q.hasOwnProperty("notification")) {
    var n = q.notification;

    // Special request option to show a certain card in series
    var cardRequested = n.showCardExplicit;

    // Figure out where in process the user is
    var sendD = n.sendDate;
    var sendT = n.sendTime;
    var sendR = n.recipient;
    var sendC = n.recipientComm;

    var cardOneIncomplete = sendD == null || sendT == null || sendR == null || sendC == null;

    // Show first card if missing required data or if specifically requested
    if (cardRequested == 0 || !cardOneIncomplete) {

    } else {
      res.render("casemanagers/notifications/parameters", { notification: n });
    }

  // Catchall: just start with first notification card
  } else {
    res.render("casemanagers/notifications/parameters", { notification: {} });
  }
});

// FOOBAR
router.get("/other", function (req, res) { 
  res.send("Goeeod")
});



// EXPORT ROUTER OBJECt
module.exports = router;



// UTILITY FUNCIONS
function retrieveClientsAndClientContactMethods (cmid) {
  var rawQuery =  " SELECT * FROM comms " + 
                  " LEFT JOIN commconns ON (commconns.comm = comms.commid) " +
                  " LEFT JOIN clients ON (commconns.client = clients.clid) " +
                  " LEFT JOIN cms ON (clients.cm = cms.cmid) " +
                  " WHERE cms.cmid = 59; ";
}




