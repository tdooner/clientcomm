

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../models/models");
const Alerts        = modelsImport.Alerts;
const Client        = modelsImport.Client;
const Clients       = modelsImport.Clients;
const Convo         = modelsImport.Convo;
const Message       = modelsImport.Message;
const Communication = modelsImport.Communication;


// Twilio library tools and secrets
var credentials     = require("../../credentials");
var ACCOUNT_SID     = credentials.accountSid;
var AUTH_TOKEN      = credentials.authToken;
var twilio          = require("twilio");
var twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// General error handling
var errorHandling   = require("./utilities/errorHandling");
var error_500       = errorHandling.error_500;


// ROUTES
// General style notes:
// 1. camelCase throughout
// 2. new naming conventions to "generalize" and influence future database changes


// Standard checks for every role, no matter
router.use(function (req, res, next) {
    console.log("--------------------")
    console.log("res.locals.FLASH_ALERTS")
    console.log(res.locals.FLASH_ALERTS)
  Alerts.findByUser(req.user.cmid)
  .then((alerts) => {
    res.locals.ALERTS_FEED = alerts;
    next()
  }).catch(error_500(res))
});


// Reroute from standard drop endpoint
router.get("/", function (req, res) {

  // need to route if owner
  // need to route if supervisor
  // else based on class
  if (req.user.class == "primary") {
    res.redirect("/v4/users/" + req.user.cmid + "/primary");
  } else if (req.user.class == "support") {
    res.send("support")
    // res.redirect("/v4/users/" + req.user.cmid + "/support");
  } else {
    res.redirect("/404")
  }

});


// To do: Some sort of handling for the type of user
// Then direct to the appropriate sub-directory of routes

var primary = require("./roles/primary");
router.use("/users/:userID/primary", primary);


var alerts = require("./support/alerts");
router.use("/alerts", alerts);




// EXPORT ROUTER OBJECt
module.exports = router;


