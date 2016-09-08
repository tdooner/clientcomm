

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../models/models");
const Alerts        = modelsImport.Alerts;


// Twilio library tools and secrets
var credentials     = require("../../../credentials");
var ACCOUNT_SID     = credentials.accountSid;
var AUTH_TOKEN      = credentials.authToken;
var twilio          = require("twilio");
var twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// General error handling
var errorHandling   = require("../utilities/errorHandling");
var error500       = errorHandling.error500;


// Access utilities
var accessChecking  = require("../utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;




// ROUTES

// Primary hub view, loads in active clients by default
router.get("/close/:alertID", function (req, res) {
  Alerts.closeOne(req.params.alertID)
  .then(() => {
    res.json({ closed: true });
  }).catch(error500(res));
});



// EXPORT ROUTER OBJECt
module.exports = router;


