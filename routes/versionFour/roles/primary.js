

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../models/models");
const Client        = modelsImport.Client;
const Clients       = modelsImport.Clients;
const ColorTags       = modelsImport.ColorTags;
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
                "/primary/clients/open"
              );
});


router.get("/clients/open", function (req, res) {
  const managerID = Number(req.params.userID);
  const active    = true;

  Clients.findByManager(managerID, active)
  .then((clients) => {
    res.render("v4/primaryUser/clients", {
      hub: {
        tab: "clients",
        sel: "open"
      },
      clients: clients
    });
  }).catch(error_500(res));
});


router.get("/clients/closed", function (req, res) {
  const managerID = Number(req.params.userID);
  const active    = false;

  Clients.findByManager(managerID, active)
  .then((clients) => {
    res.render("v4/primaryUser/clients", {
      hub: {
        tab: "clients",
        sel: "closed"
      },
      clients: clients
    });
  }).catch(error_500(res));
});


// Client-specific operations
var colorTags = require("./primary/colorTags");
router.use("/colortags", colorTags);


// Client-specific operations
var templates = require("./primary/templates");
router.use("/templates", templates);


// Client-specific operations
var specificClient = require("./primary/specificClient");
router.use("/clients/client/:clientID", specificClient);

// EXPORT ROUTER OBJECt
module.exports = router;


