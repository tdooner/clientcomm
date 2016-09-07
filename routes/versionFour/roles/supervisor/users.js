

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
let error_500       = errorHandling.error_500;
let emailAlerts     = require("../../utilities/emailAlerts");
let alertOfAccountActivation = emailAlerts.alertOfAccountActivation;


// Create base URL for this page
router.use((req, res, next) => {
  res.locals.parameters = req.params;
  req.redirectUrlBase = `/v4/orgs/${req.user.org}/users/${req.user.cmid}/supervisor/department/${req.params.departmentID}/users/`;
  next();
});


// ROUTES
router.get("/users/", (req, res) => {
  res.redirect(req.redirectUrlBase + "filter/active");
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
    // Filter by department
    users = users.filter(function (user) {
      return req.user.department == user.department;
    });

    res.render("v4/supervisor/users/users", {
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
    res.redirect(req.redirectUrlBase);
  }).catch(error_500(res));
});

router.get("/users/activate/:targetUserID", (req, res) => {
  Users.changeActivityStatus(req.params.targetUserID, true)
  .then(() => {
    req.flash("success", "Activated user.");
    res.redirect(req.redirectUrlBase);
  }).catch(error_500(res));
});

router.get("/users/create", (req, res) => {
  res.render("v4/supervisor/users/create");
});

router.post("/users/create", (req, res) => {
  let first = req.body.first;
  let middle = req.body.middle;
  let last = req.body.last;
  let email = req.body.email;
  let orgID = req.user.org;
  let department = req.user.department;
  let position = req.body.position;
  let className = req.body.className;
  Users.createOne(first, middle, last, email, orgID, department, position, className)
  .then((autoCreatedPassword) => {
    alertOfAccountActivation(email, autoCreatedPassword);
    req.flash("success", "Created new user.");
    res.redirect(req.redirectUrlBase);
  }).catch(error_500(res));
});

router.get("/users/create/check_email/:email", (req, res) => {
  Users.findByEmail(decodeURIComponent(req.params.email))
  .then((user) => {
    res.json({ user: user });
  }).catch(error_500(res));
});

router.get("/users/edit/:targetUserID", (req, res) => {
  Users.findByID(req.params.targetUserID)
  .then((targetUser) => {
    if (targetUser) {
      res.render("v4/supervisor/users/edit", {
        targetUser: targetUser
      })
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});

router.post("/users/edit/:targetUserID", (req, res) => {
  let targetUserID = req.params.targetUserID;
  let first = req.body.first;
  let middle = req.body.middle;
  let last = req.body.last;
  let email = req.body.email;
  let department = req.user.department;
  let position = req.body.position;
  let className = req.body.className;
  Users.updateOne(targetUserID, first, middle, last, email, department, position, className)
  .then(() => {
    let activeSupervisor = (className == "supervisor");
    return DepartmentSupervisors.updateSupervisor(department, targetUserID, activeSupervisor)
  }).then(() => {
    req.flash("success", "Updated user.");
    res.redirect(req.redirectUrlBase);
  }).catch(error_500(res));
});

router.get("/users/transfer/:targetUserID", (req, res) => {
  let departments;
  Departments.selectByOrgID(req.user.org)
  .then((depts) => {
    departments = depts;
    return Users.findByID(req.params.targetUserID)
  }).then((targetUser) => {
    if (targetUser) {
      res.render("v4/supervisor/users/transfer", {
        targetUser: targetUser,
        departments: departments
      })
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});

router.post("/users/transfer/:targetUserID", (req, res) => {
  let targetUserID = req.params.targetUserID;
  let department = req.body.department;
  Users.transferOne(targetUserID, department)
  .then(() => {
    req.flash("success", "Transfered user.");
    res.redirect(req.redirectUrlBase);
  }).catch(error_500(res));
});





// EXPORT ROUTER OBJECt
module.exports = router;


