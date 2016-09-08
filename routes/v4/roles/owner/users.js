

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

router.get("/users/", (req, res) => {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/owner/users/filter/active");
});

router.get("/users/filter/:activeStatus", (req, res) => {
  let activeStatus;
  if (req.params.activeStatus == "active") {
    activeStatus = true;
  } else { 
    activeStatus = false;
  }

  Users.findByOrg(req.user.org, activeStatus)
  .then((users) => {
    res.render("v4/owner/users/users", {
      hub: {
        tab: "users",
        sel: activeStatus ? "active" : "inactive"
      },
      users: users
    });
  }).catch(error_500(res));
});

router.get("/users/deactivate/:targetUserID", (req, res) => {
  Users.changeActivityStatus(req.params.targetUserID, false)
  .then(() => {
    req.flash("success", "Deactivated user.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/users");
  }).catch(error_500(res));
});

router.get("/users/activate/:targetUserID", (req, res) => {
  Users.changeActivityStatus(req.params.targetUserID, true)
  .then(() => {
    req.flash("success", "Activated user.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/users");
  }).catch(error_500(res));
});

router.get("/users/create", (req, res) => {
  Departments.selectByOrgID(req.user.org)
  .then((departments) => {
    res.render("v4/owner/users/create", {
      departments: departments
    });
  }).catch(error_500(res));
});

router.post("/users/create", (req, res) => {
  let first = req.body.first;
  let middle = req.body.middle;
  let last = req.body.last;
  let email = req.body.email;
  let orgID = req.user.org;
  let department = req.body.department;
  let position = req.body.position;
  let className = req.body.className;
  Users.createOne(first, middle, last, email, orgID, department, position, className)
  .then((autoCreatedPassword) => {
    alertOfAccountActivation(email, autoCreatedPassword);
    req.flash("success", "Created new user.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/users");
  }).catch(error_500(res));
});

router.get("/users/create/check_email/:email", (req, res) => {
  Users.findByEmail(decodeURIComponent(req.params.email))
  .then((user) => {
    res.json({ user: user });
  }).catch(error_500(res));
});

router.get("/users/edit/:targetUserID", (req, res) => {
  let departments;
  Departments.selectByOrgID(req.user.org)
  .then((depts) => {
    departments = depts;
    return Users.findByID(req.params.targetUserID)
  }).then((targetUser) => {
    if (targetUser) {
      res.render("v4/owner/users/edit", {
        targetUser: targetUser,
        departments: departments
      })
    } else {
      notFound(res);
    }
  }).catch(error_500(res));
});

router.post("/users/edit/:targetUserID", (req, res) => {
  let targetUserID = req.params.targetUserID;
  let first = req.body.first;
  let middle = req.body.middle;
  let last = req.body.last;
  let email = req.body.email;
  let department = req.body.department;
  let position = req.body.position;
  let className = req.body.className;
  Users.updateOne(targetUserID, first, middle, last, email, department, position, className)
  .then(() => {
    req.flash("success", "Updated user.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/owner/users");
  }).catch(error_500(res));
});





// EXPORT ROUTER OBJECt
module.exports = router;


