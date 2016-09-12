'use strict';

// (Sub) router
const express         = require("express");
const router          = express.Router({mergeParams: true});

// Models
const modelsImport          = require("../models/models");
const Alerts                = modelsImport.Alerts;
const Client                = modelsImport.Client;
const Clients               = modelsImport.Clients;
const ColorTags             = modelsImport.ColorTags;
const Communication         = modelsImport.Communication;
const Communications        = modelsImport.Communications;
const CommConns             = modelsImport.CommConns;
const Convo                 = modelsImport.Convo;
const Conversations         = modelsImport.Conversations;
const DepartmentSupervisors = modelsImport.DepartmentSupervisors;
const Departments           = modelsImport.Departments;
const Groups                = modelsImport.Groups;
const Message               = modelsImport.Message;
const Messages              = modelsImport.Messages;
const Notifications         = modelsImport.Notifications;
const Organizations         = modelsImport.Organizations;
const PhoneNumbers          = modelsImport.PhoneNumbers;
const Templates             = modelsImport.Templates;
const Users                 = modelsImport.Users;


// Twilio library tools and secrets
const credentials     = require("../credentials");
const ACCOUNT_SID     = credentials.accountSid;
const AUTH_TOKEN      = credentials.authToken;
const twilio          = require("twilio");
const twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// Outside library requires
let moment    = require("moment");
let moment_tz = require("moment-timezone");


// General error handling
const errorHandling = require("./errorHandling");
const error500     = errorHandling.error500;
const notFound      = errorHandling.notFound;

// Internal utilities
let logging                 = require("./logging");
let logClientActivity       = logging.logClientActivity;
let logConversationActivity = logging.logConversationActivity;
let emailer                 = require("./emailer");

// Standard checks for every role, no matter
// Add flash alerts
router.use((req, res, next) => {
  Alerts.findByUser(req.user.cmid)
  .then((alerts) => {
    res.locals.ALERTS_FEED = alerts;
    next();
  }).catch(error500(res));
});

// Add organization
router.use((req, res, next) => {
  Organizations.findByID(req.user.org)
  .then((org) => {
    res.locals.organization = org;
    next();
  }).catch(error500(res));
});

// Add department
router.use((req, res, next) => {
  Departments.findByID(req.user.department)
  .then((department) => {
    // if no department, provide some dummy attributes
    if (!department) {
      department = {
        name:          "Unassigned",
        organization:  req.user.org,
        phone_number:  null,
        department_id: null
      };
    }
    res.locals.department = department;
    next();
  }).catch(error500(res));
});

router.use((req, res, next) => {
  res.locals.level = "org"
  next();
});

router.get("/org", (req, res) => {
  let clients;
  let departments;
  let departmentFilter = req.user.department || Number(req.query.department) || null;
  let userFilter = req.query.user || null;
  let users;
  let countsByDay, countsByWeek;

  Departments.findByOrg(req.user.org, true)
  .then((depts) => {
    departments = depts;

    if (departmentFilter) {
      if (req.user.department) departments = departments.filter((d) => { return d.department_id === departmentFilter});
      return Users.findByDepartment(departmentFilter, true)
    } else {
      return Users.findByOrg(req.user.org, true)
    }
  }).then((u) => {
    users = u;

    if (departmentFilter) {
      users = users.filter((u) => { return u.department == departmentFilter});
      return Clients.findByDepartment(departmentFilter, true);
    } else {
      return Clients.findByOrg(departmentFilter, true);
    }
  }).then((c) => {
    clients = c;

    if (departmentFilter) {
      let userIds = users.map((u) => { return u.cmid });
      clients = clients.filter((c) => { return userIds.indexOf(c.cm) > -1 });
      return Messages.countsByDepartment(req.user.org, departmentFilter, "day")
    } else {
      return Messages.countsByOrg(req.user.org, "day")
    }
  }).then((counts) => {
    countsByDay = counts;

    if (departmentFilter) {
      return Messages.countsByDepartment(req.user.org, departmentFilter, "week")
    } else {
      return Messages.countsByOrg(req.user.org, "week")
    }
  }).then((counts) => {
    countsByWeek = counts;

    res.render("dashboard", {
      hub: {
        tab: "dashboard/index",
        sel: null
      },
      users:            users,
      userFilter:       userFilter,
      departments:      departments,
      departmentFilter: departmentFilter,
      clients:          clients,
      countsByDay:      countsByDay,
      countsByWeek:     countsByWeek
    });
  }).catch(error500(res));
});

router.get("/org/departments", (req, res) => {
  let status = req.query.status === "inactive" ? false : true;

  Departments.findByOrg(req.user.org, status)
  .then((departments) => {
    res.render("departments/index", {
      hub: {
        tab: "departments",
        sel: status ? "active" : "inactive"
      },
      departments: departments
    });
  }).catch(error500(res));
});

router.get("/org/departments/create", (req, res) => {
  PhoneNumbers.findByOrgID(req.user.org)
  .then((phoneNumbers) => {
    res.render("departments/create", {
      phoneNumbers: phoneNumbers
    });
  }).catch(error500(res));
});

router.post("/org/departments/create", (req, res) => {
  Departments.createOne(
                req.user.org,    // organization
                req.body.name,   // new dep't name
                req.body.number, // associated number
                req.user.cmid    // created by
  ).then(() => {
    req.flash("success", "Made new department.");
    res.redirect("/org/departments");
  }).catch(error500(res));
});

router.get("/org/departments/:departmentId/edit", (req, res) => {
  Departments.findByID(req.params.departmentId)
  .then((department) => {
    if (department) {
      PhoneNumbers.findByOrgID(req.user.org)
      .then((phoneNumbers) => {
        res.render("departments/edit", {
          department: department,
          phoneNumbers: phoneNumbers
        });
      }).catch(error500(res));

    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

router.post("/org/departments/:departmentId/edit", (req, res) => {
  Departments.editOne(
    req.params.departmentId, // department
    req.body.name,           // new name
    req.body.number          // new associated number
  ).then(() => {
    req.flash("success", "Updated department.");
    res.redirect("/org/departments");
  }).catch(error500(res));
});

router.get("/org/departments/:departmentId/supervisors", (req, res) => {
  let supervisors;
  DepartmentSupervisors.findByDepartmentIDs(req.params.departmentId)
  .then((s) => {
    supervisors = s;
    return Users.findByOrg(req.user.org)
  }).then((users) => {

    // Limit options to only users already added to the department
    // "Promote from within" concept
    let members = users.filter(function (u) {
      return Number(u.department) == Number(req.params.departmentId);
    });

    res.render("departments/supervisors", {
      supervisors: supervisors,
      members: members
    });
  }).catch(error500(res));
});

router.post("/org/departments/:departmentId/supervisors", (req, res) => {
  if (!Array.isArray(req.body.supervisorIds)) req.body.supervisorIds = [req.body.supervisorIds];

  DepartmentSupervisors.updateSupervisors(
    req.params.departmentId, 
    req.body.supervisorIds, 
    req.body.revertClass
  ).then(() => {
    req.flash("success", "Updated department supervisors.");
    res.redirect("/org/departments");
  }).catch(error500(res));
});

router.get("/org/departments/:departmentID/alter/:case", (req, res) => {
  let state = req.params.case === "close" ? false : true;

  Departments.findMembers(req.params.departmentID)
  .then((members) => {
    if (members.length == 0) {
      Departments.alterCase(req.params.departmentID, state)
      .then(() => {
        req.flash("success", "Changed department activity status.");
        res.redirect("/org/departments");
      }).catch(error500(res));
    } else {
      req.flash("warning", "Need to remove or close out members first.");
      res.redirect("/org/departments");
    }
  }).catch(error500(res));
});

router.get("/org/users", (req, res) => {
  let status = req.query.status === "inactive" ? false : true;
  let department = req.user.department || req.query.departmentId;

  // Controls against a case where the owner would accidentally have a department
  if (req.user.class === "owner" && !req.query.departmentId) {
    department = null;
  }

  Users.findByOrg(req.user.org, status)
  .then((users) => {

    // Limit by department if supervisor, or specified in query
    if (department) {
      users = users.filter((user) => {
        return Number(req.user.department) === Number(user.department);
      });        
    }

    res.render("users/index", {
      hub: {
        tab: "users",
        sel: status ? "active" : "inactive"
      },
      users: users
    });
  }).catch(error500(res));
});

router.get("/org/users/create", (req, res) => {
  res.render("users/create");
});

router.post("/org/users/create", (req, res) => {
  Users.findByEmail(decodeURIComponent(req.body.email))
  .then((u) => {
    if (u) {
      req.flash("warning", "That email already exists in the system.");
      res.redirect("/org/users/create");
    } else {
      Users.createOne(
        req.body.first, 
        req.body.middle, 
        req.body.last, 
        req.body.email, 
        req.user.org, 
        req.user.department, 
        req.body.position, 
        req.body.className
      ).then((generatedPass) => {
        emailer.activationAlert(req.body.email, generatedPass);
        req.flash("success", "Created new user, sent invite email.");
        res.redirect("/org/users");
      }).catch(error500(res));
    }
  }).catch(error500(res));
});

router.get("/org/users/create/check/:email", (req, res) => {
  Users.findByEmail(decodeURIComponent(req.params.email))
  .then((u) => {
    res.json({user: u});
  }).catch(error500(res));
});

router.get("/org/users/:targetUserID/alter/:case", (req, res) => {
  let state = req.params.case === "close" ? false : true;

  Users.changeActivityStatus(req.params.targetUserID, state)
  .then(() => {
    req.flash("success", "Updated user activity state.");
    res.redirect("/org/users");
  }).catch(error500(res));
});

router.get("/org/users/:targetUser/edit", (req, res) => {
  let departments;
  Departments.findByOrg(req.user.org)
  .then((depts) => {
    departments = depts;
    return Users.findByID(req.params.targetUser)
  }).then((targetUser) => {
    if (targetUser) {
      res.render("users/edit", {
        targetUser: targetUser,
        departments: departments
      })
    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

router.post("/org/users/:targetUser/edit", (req, res) => {
  Users.updateOne(
          req.params.targetUser, 
          req.body.first, 
          req.body.middle, 
          req.body.last, 
          req.body.email, 
          req.body.department, 
          req.body.position, 
          req.body.className
  ).then(() => {
    req.flash("success", "Updated user.");
    res.redirect("/org/users");
  }).catch(error500(res));
});

router.get("/org/users/:targetUser/transfer", (req, res) => {
  let departments;
  Departments.findByOrg(req.user.org)
  .then((d) => {
    departments = d;
    return Users.findByID(req.params.targetUser)
  }).then((u) => {
    if (u) {
      res.render("users/transfer", {
        targetUser: u,
        departments: departments
      })
    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

router.post("/org/users/:targetUser/transfer", (req, res) => {
  Users.transferOne(
    req.params.targetUser, 
    req.body.department
  ).then(() => {
    req.flash("success", "Transfered user.");
    res.redirect("/org/users");
  }).catch(error500(res));
});

router.get("/org/clients", (req, res) => {
  let status      = req.query.status == "closed" ? false : true;
  let department  = req.user.department || req.query.departmentId;

  // Controls against a case where the owner would accidentally have a department
  if (req.user.class === "owner" && !req.query.departmentId) {
    department = null;
  }

  let method;
  if (department) {
    method = Clients.findByDepartment(department, status);
  } else {
    method = Clients.findByOrg(req.user.org, status);
  }

  method.then((clients) => {
    if (req.query.limitByUser) {
      clients = clients.filter((c) => {
        return Number(c.cm) === Number(req.query.limitByUser);
      });
    }

    res.render("clients/index", {
      hub: {
        tab: "clients",
        sel: status ? "open" : "closed"
      },
      clients: clients,
      limitByUser: req.query.limitByUser || null
    });
  }).catch(error500(res));
});

module.exports = router;
