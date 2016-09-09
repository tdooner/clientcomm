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
var moment    = require("moment");
var moment_tz = require("moment-timezone");


// General error handling
const errorHandling = require("./errorHandling");
const error500     = errorHandling.error500;
const notFound      = errorHandling.notFound;

// Internal utilities
var logging                 = require("./logging");
var logClientActivity       = logging.logClientActivity;
var logConversationActivity = logging.logConversationActivity;

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
  if (req.user.class === "supervisor") {
    let clients, countsByDay, countsByWeek, department, users;
    let orgID = Number(req.user.org);
    let departmentID = Number(req.user.department);
    let userFilterID = Number(req.query.targetUserID);
    if (isNaN(userFilterID)) userFilterID = null;

    Departments.findByID(orgID, true)
    .then((dept) => {
      department = dept;
      return Users.findByDepartment(departmentID, true)
    }).then((usrs) => {
      users = usrs;
      return Clients.findByDepartment(departmentID, true);
    }).then((cls) => {
      clients = cls;
      if (userFilterID) {
        clients.filter(function(client) {
          return client.cm == userFilterID;
        });
      }

      if (userFilterID) return Messages.countsByUser(orgID, userFilterID, "day");
      else              return Messages.countsByDepartment(orgID, departmentID, "day");
    }).then((counts) => {
      countsByDay = counts;
      if (userFilterID) return Messages.countsByUser(orgID, userFilterID, "week");
      else              return Messages.countsByDepartment(orgID, departmentID, "week");
    }).then((counts) => {
      countsByWeek = counts;
      res.render("dashboard", {
        hub: {
          tab: "dashboard",
          sel: null
        },
        departments: [department],
        users: users,
        userFilterID, userFilterID,
        clients: clients,
        countsByWeek: countsByWeek,
        departmentFilterID: department.department_id,
        countsByDay: countsByDay
      });
    }).catch(error500(res));    
  } else if (req.user.class === "owner") {
    let departments, countsByWeek, countsByDay;
    let departmentFilterID = Number(req.query.departmentID);
    if (isNaN(departmentFilterID)) departmentFilterID = null;

    Departments.selectByOrgID(req.user.org, true)
    .then((depts) => {
      departments = depts;

      if (departmentFilterID) {
        return Messages.countsByDepartment(req.user.org, departmentFilterID, "day")
      } else {
        return Messages.countsByOrg(req.user.org, "day")
      }
    }).then((counts) => {
      countsByDay = counts;

      if (departmentFilterID) {
        return Messages.countsByDepartment(req.user.org, departmentFilterID, "week")
      } else {
        return Messages.countsByOrg(req.user.org, "week")
      }
    }).then((counts) => {
      countsByWeek = counts;
      res.render("dashboard", {
        hub: {
          tab: "dashboard",
          sel: null
        },
        departments: departments,
        departmentFilterID: departmentFilterID,
        countsByWeek: countsByWeek,
        countsByDay: countsByDay
      });
    }).catch(error500(res));
  } else {
    notFound(res)
  }
});

router.get("/org/departments", (req, res) => {
  let status = req.query.status === "inactive" ? false : true;

  Departments.selectByOrgID(req.user.org, status)
  .then((departments) => {
    res.render("departments", {
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

    res.render("users", {
      hub: {
        tab: "users",
        sel: status ? "active" : "inactive"
      },
      users: users
    });
  }).catch(error500(res));
});

// TODO: Issue with clients overlap on Nav, accidentally built this one out so it renders
router.get("/org/clients", (req, res) => {
  let status = req.query.status == "closed" ? false : true;
  let department = req.user.department || req.query.departmentId;

  // Controls against a case where the owner would accidentally have a department
  if (req.user.class === "owner" && !req.query.departmentId) {
    department = null;
  }

  let method;
  if (department) {
    method = Clients.findByOrg(req.user.org, status);
  } else {
    method = Clients.findByDepartment(department, status);
  }

  method.then((clients) => {
    res.render("clients", {
      hub: {
        tab: "clients",
        sel: status ? "open" : "closed"
      },
      clients: clients,
      limitByUser: null
    });
  }).catch(error500(res));
});

module.exports = router;
