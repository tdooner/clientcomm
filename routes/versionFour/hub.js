

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../models/models");
const Client        = modelsImport.Client;
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
  res.redirect("/v4/users/" + req.user.cmid);
});


// Default pass-through check to make sure accounts are querying endpoints correctly
router.get("/users/:userID", function (req, res, next) {
  const userID0 = Number(req.params.userID);
  const userID1 = Number(req.user.cmid);
  console.log("Params2: ", req.params);
  console.log([userID0, userID1])
  if (confirmMatch("number", [userID0, userID1])) {
    next();
  } else {
    res.redirect("/404");
  }
});


// Primary hub view, loads in active clients by default
router.get("/users/:userID", function (req, res) {

  const managerID = Number(req.params.userID);
  const active    = true;

  Client
  .findByManager(managerID, active)
  .then((clients) => {
    res.render("v4/hub", {
      clients: clients
    });
  }).catch(error_500(res));

});


// EXPORT ROUTER OBJECt
module.exports = router;


