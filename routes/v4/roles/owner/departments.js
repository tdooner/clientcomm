

// (Sub) router
let express         = require("express");
let router          = express.Router({mergeParams: true});


// Models
let modelsImport  = require("../../../../models/models");
let Client        = modelsImport.Client;
let Clients       = modelsImport.Clients;
let ColorTags     = modelsImport.ColorTags;
let Convo         = modelsImport.Convo;
let Users         = modelsImport.Users;
let Message       = modelsImport.Message;
let Messages      = modelsImport.Messages;
let Communication = modelsImport.Communication;
let Departments   = modelsImport.Departments;
let DepartmentSupervisors = modelsImport.DepartmentSupervisors;
let PhoneNumbers  = modelsImport.PhoneNumbers;


// General error handling
let errorHandling   = require("../../utilities/errorHandling");
let error500       = errorHandling.error500;



// ROUTES



















// EXPORT ROUTER OBJECt
module.exports = router;


