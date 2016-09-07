

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


// General error handling
let errorHandling   = require("../../utilities/errorHandling");
let error_500       = errorHandling.error_500;
let emailAlerts     = require("../../utilities/emailAlerts");
let alertOfAccountActivation = emailAlerts.alertOfAccountActivation;



// ROUTES

router.get("/numbers/", (req, res) => {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/owner/numbers/all");
});

router.get("/numbers/all", (req, res) => {
  PhoneNumbers.findByOrgID(req.user.org)
  .then((numbers) => {
    res.render("v4/owner/numbers/numbers", {
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


