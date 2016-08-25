

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
                "/supervisor/users/filter/active");
});

router.get("/filter/:activeStatus", function (req, res) {
  var activeStatus;
  if (req.params.activeStatus == "active") {
    activeStatus = true;
  } else { 
    activeStatus = false;
  }

  Users.findByOrg(req.user.org, activeStatus)
  .then((users) => {
    // Filter by department
    users = users.filter(function (user) {
      return req.user.department == user.department;
    });
    res.render("v4/supervisorUser/users/users", {
      hub: {
        tab: "users",
        sel: activeStatus ? "active" : "inactive"
      },
      users: users
    });
  }).catch(error_500(res));
});

router.get("/deactivate/:targetUserID", function (req, res) {
  Users.changeActivityStatus(req.params.targetUserID, false)
  .then(() => {
    req.flash("success", "Deactivated user.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/supervisor/users");
  }).catch(error_500(res));
});

router.get("/activate/:targetUserID", function (req, res) {
  Users.changeActivityStatus(req.params.targetUserID, true)
  .then(() => {
    req.flash("success", "Activated user.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/supervisor/users");
  }).catch(error_500(res));
});

router.get("/create", function (req, res) {
  Departments.selectByOrgID(req.user.org)
  .then((departments) => {
    res.render("v4/supervisorUser/users/create", {
      departments: departments
    });
  }).catch(error_500(res));
});

router.post("/create", function (req, res) {
  const first = req.body.first;
  const middle = req.body.middle;
  const last = req.body.last;
  const email = req.body.email;
  const orgID = req.user.org;
  const department = req.body.department;
  const position = req.body.position;
  const className = req.body.className;
  Users.createOne(first, middle, last, email, orgID, department, position, className)
  .then((autoCreatedPassword) => {
    alertOfAccountActivation(email, autoCreatedPassword);
    req.flash("success", "Created new user.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/supervisor/users");
  }).catch(error_500(res));
});

router.get("/create/check_email/:email", function (req, res) {
  Users.findByEmail(decodeURIComponent(req.params.email))
  .then((user) => {
    res.json({ user: user });
  }).catch(error_500(res));
});

router.get("/edit/:targetUserID", function (req, res) {
  var departments;
  Departments.selectByOrgID(req.user.org)
  .then((depts) => {
    departments = depts;
    return Users.findByID(req.params.targetUserID)
  }).then((targetUser) => {
    if (targetUser) {
      res.render("v4/supervisorUser/users/edit", {
        targetUser: targetUser,
        departments: departments
      })
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});

router.post("/edit/:targetUserID", function (req, res) {
  const targetUserID = req.params.targetUserID;
  const first = req.body.first;
  const middle = req.body.middle;
  const last = req.body.last;
  const email = req.body.email;
  const department = req.body.department;
  const position = req.body.position;
  const className = req.body.className;
  Users.updateOne(targetUserID, first, middle, last, email, department, position, className)
  .then(() => {
    req.flash("success", "Updated user.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/supervisor/users");
  }).catch(error_500(res));
});





// EXPORT ROUTER OBJECt
module.exports = router;


