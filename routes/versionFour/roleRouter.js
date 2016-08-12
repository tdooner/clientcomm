

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../models/models");
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


// Access utilities
var accessChecking  = require("./utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;


// ROUTES
// General style notes:
// 1. camelCase throughout
// 2. new naming conventions to "generalize" and influence future database changes

// Reroute from standard drop endpoint
router.get("/", function (req, res) {
  res.redirect("/v4/users/" + req.user.cmid + "/primary");
});


// Default pass-through check to make sure accounts are querying endpoints correctly
router.use(function (req, res, next) {
  const userID0 = Number(req.params.userID);
  const userID1 = Number(req.user.cmid);
  if (confirmMatch("number", [userID0, userID1])) {
    next();
  } else {
    // To do: why is this always 404-ing?
    next();
    // res.redirect("/404");
  }
});


// To do: Some sort of handling for the type of user
// Then direct to the appropriate sub-directory of routes

var primary = require("./roles/primary");
router.use("/users/:userID/primary", primary);




// EXPORT ROUTER OBJECt
module.exports = router;


