

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
  if (confirmMatch("number", [userID0, userID1])) {
    next();
  } else {
    res.redirect("/404");
  }
});


// ROUTES

// Primary hub view, loads in active clients by default
router.get("/", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/primary/clients/open");
});


var colorTags = require("./primary/colorTags");
router.use("/colortags", colorTags);


var templates = require("./primary/templates");
router.use("/templates", templates);


var notifications = require("./primary/notifications");
router.use("/notifications", notifications);


var groups = require("./primary/groups");
router.use("/groups", groups);


var clients = require("./primary/clients");
router.use("/clients", clients);


// Client-specific operations
var client = require("./primary/client");
router.use("/clients/client/:clientID", client);

// EXPORT ROUTER OBJECt
module.exports = router;


