// ALL DONE

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Notifications = modelsImport.Notifications;
const Templates     = modelsImport.Templates;
const Clients       = modelsImport.Clients;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error500       = errorHandling.error500;


// Access utilities
var accessChecking  = require("../../utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;

// DATETIME VARIABLES FOR EJS
var moment          = require("moment");
var moment_tz       = require("moment-timezone");


// Create base URL for this page
router.use((req, res, next) => {
  res.locals.parameters = req.params;
  req.redirectUrlBase = `/v4/orgs/${req.params.orgID}/users/${req.params.userID}/primary`;
  next();
});

// GENERAL CHECK




// EXPORT ROUTER OBJECt
module.exports = router;


