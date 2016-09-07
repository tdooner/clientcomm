// ALL DONE

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Client        = modelsImport.Client;
const Clients       = modelsImport.Clients;
const ColorTags     = modelsImport.ColorTags;
const Convo         = modelsImport.Convo;
const Message       = modelsImport.Message;
const Messages      = modelsImport.Messages;
const Communication = modelsImport.Communication;
const Templates     = modelsImport.Templates;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;

// Create base URL for this page
router.use((req, res, next) => {
  res.locals.parameters = req.params;
  req.redirectUrlBase = `/v4/orgs/${req.params.orgID}/users/${req.params.userID}/primary`;
  next();
});


// ROUTES



















// EXPORT ROUTER OBJECt
module.exports = router;


