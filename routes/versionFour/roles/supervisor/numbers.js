

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
const Departments   = modelsImport.Departments;
const PhoneNumbers  = modelsImport.PhoneNumbers;
const Organizations = modelsImport.Organizations; 
const Users         = modelsImport.Users; 


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;
var emailAlerts     = require("../../utilities/emailAlerts");
var alertOfAccountActivation = emailAlerts.alertOfAccountActivation;



// ROUTES

router.get("/", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/owner/numbers/all");
});

router.get("/all", function (req, res) {
  PhoneNumbers.findByOrgID(req.user.org)
  .then((numbers) => {
    res.render("v4/ownerUser/numbers/numbers", {
      hub: {
        tab: "numbers",
        sel: null
      },
      numbers: numbers
    });
  }).catch(error_500(res));
});






// EXPORT ROUTER OBJECt
module.exports = router;


