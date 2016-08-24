

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


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;



// ROUTES

router.get("/", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/owner/departments/active");
});

router.get("/:activeStatus", function (req, res) {
  var activeStatus = req.params.activeStatus;
  if (activeStatus == "active") activeStatus == true;
  else activeStatus = false;

  Departments.selectByOrgID(req.user.org)
  .then((departments) => {
    res.render("v4/ownerUser/departments/departments", {
      hub: {
        tab: "departments",
        sel: activeStatus ? "active" : "inactive"
      },
      departments: departments
    });
  }).catch(error_500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


