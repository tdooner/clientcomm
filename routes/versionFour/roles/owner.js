

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../models/models");
const Client        = modelsImport.Client;
const Clients       = modelsImport.Clients;
const ColorTags     = modelsImport.ColorTags;
const Convo         = modelsImport.Convo;
const Message       = modelsImport.Message;
const Communication = modelsImport.Communication;


// Twilio library tools and secrets
var credentials     = require("../../../credentials");
var ACCOUNT_SID     = credentials.accountSid;
var AUTH_TOKEN      = credentials.authToken;
var twilio          = require("twilio");
var twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// General error handling
var errorHandling   = require("../utilities/errorHandling");
var error_500       = errorHandling.error_500;


// Access utilities
var accessChecking  = require("../utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;


// GENERAL CHECK
// Default pass-through check to make sure accounts are querying endpoints correctly
router.use(function (req, res, next) {
  const userID0 = Number(req.params.userID);
  const userID1 = Number(req.user.cmid);
  if (!confirmMatch("number", [userID0, userID1])) {
    res.redirect("/404");
  } else if (req.user.class !== "owner") {
    res.redirect("/404");
  } else {
    next();
  }
});


// ROUTES

// Primary hub view, loads in active clients by default
router.get("/", function (req, res) {
  res.redirect(`/v4/orgs/${req.params.orgID}/users/${req.params.userID}/owner/dashboard`);
});


var dashboard = require("./owner/dashboard");
router.use("/dashboard", dashboard);

var departments = require("./owner/departments");
router.use("/departments", departments);

var users = require("./owner/users");
router.use("/users", users);

var numbers = require("./owner/numbers");
router.use("/numbers", numbers);


module.exports = router;


