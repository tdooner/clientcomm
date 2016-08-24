

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


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;



// ROUTES

router.get("/", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/owner/departments/filter/active");
});

router.get("/filter/:activeStatus", function (req, res) {
  var activeStatus;
  if (req.params.activeStatus == "active") {
    activeStatus = true;
  } else { 
    activeStatus = false;
  }

  Departments.selectByOrgID(req.user.org, activeStatus)
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

router.get("/create", function (req, res) {
  PhoneNumbers.fingByOrgID(req.user.org)
  .then((phoneNumbers) => {
    res.render("v4/ownerUser/departments/create", {
      phoneNumbers: phoneNumbers
    });
  }).catch(error_500(res));
});

router.post("/create", function (req, res) {
  console.log(req.body);
  Departments.createOne(req.user.org, req.body.name, req.body.phoneNumber, req.user.cmid)
  .then(() => {
    console.log("ff");
    req.flash("success", "Made new department.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error_500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


