

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


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;



// ROUTES

router.get("/", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/owner/dashboard/overview");
});

router.get("/overview", function (req, res) {
  // const managerID = Number(req.params.userID);
  // const active    = true;

  // Clients.findByUser(managerID, active)
  // .then((clients) => {
    res.render("v4/ownerUser/dashboards/overall", {
      hub: {
        tab: "dashboard",
        sel: "overall"
      }
    });
  // }).catch(error_500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


