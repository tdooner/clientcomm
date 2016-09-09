

// (Sub) router
let express         = require("express");
let router          = express.Router({mergeParams: true});


// Models
let modelsImport  = require("../../../../models/models");
let Client        = modelsImport.Client;
let Clients       = modelsImport.Clients;
let ColorTags     = modelsImport.ColorTags;
let Convo         = modelsImport.Convo;
let Message       = modelsImport.Message;
let Messages      = modelsImport.Messages;
let Communication = modelsImport.Communication;
let Departments   = modelsImport.Departments;
let PhoneNumbers  = modelsImport.PhoneNumbers;
let Organizations = modelsImport.Organizations; 
let Users         = modelsImport.Users; 
let DepartmentSupervisors = modelsImport.DepartmentSupervisors;


// General error handling
let errorHandling   = require("../../utilities/errorHandling");
let error500       = errorHandling.error500;
let emailAlerts     = require("../../utilities/emailAlerts");
let alertOfAccountActivation = emailAlerts.alertOfAccountActivation;


// Create base URL for this page



// ROUTES







// EXPORT ROUTER OBJECt
module.exports = router;


