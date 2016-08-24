

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
  Departments.createOne(req.user.org, req.body.name, req.body.phoneNumber, req.user.cmid)
  .then(() => {
    req.flash("success", "Made new department.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error_500(res));
});

router.get("/edit/:departmentID", function (req, res) {
  Departments.findByID(req.params.departmentID)
  .then((department) => {
    if (department) {
      PhoneNumbers.fingByOrgID(req.user.org)
      .then((phoneNumbers) => {
        res.render("v4/ownerUser/departments/edit", {
          department: department,
          phoneNumbers: phoneNumbers
        });
      }).catch(error_500(res));
    } else {
      res.redirect("/404")
    }
  }).catch(error_500(res));
});

router.post("/edit/:departmentID", function (req, res) {
  const departmentID = req.params.departmentID;
  const name = req.body.name;
  const phoneNumber = req.body.phoneNumber;
  Departments.editOne(departmentID, name, phoneNumber)
  .then(() => {
    req.flash("success", "Updated department.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error_500(res));
});

router.get("/deactivate/:departmentID", function (req, res) {
  Departments.findMembers(req.params.departmentID)
  .then((members) => {
    if (members.length == 0) {
      Departments.deactivate(req.params.departmentID)
      .then(() => {
        req.flash("success", "Deactivated department.");
        res.redirect( "/v4/users/" + 
                      req.user.cmid + 
                      "/owner/departments");
      }).catch(error_500(res));
    } else {
      req.flash("warning", "Need to remove or close out members first.");
      res.redirect( "/v4/users/" + 
                    req.user.cmid + 
                    "/owner/departments");
    }
  }).catch(error_500(res));
});

router.get("/activate/:departmentID", function (req, res) {
  Departments.activate(req.params.departmentID)
  .then(() => {
    req.flash("success", "Activated department.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/departments");
  }).catch(error_500(res));
});




// EXPORT ROUTER OBJECt
module.exports = router;


