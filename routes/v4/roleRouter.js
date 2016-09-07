'use strict'

// (Sub) router
const express         = require("express");
const router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../models/models");
const Alerts        = modelsImport.Alerts;
const Client        = modelsImport.Client;
const Clients       = modelsImport.Clients;
const Communication = modelsImport.Communication;
const Convo         = modelsImport.Convo;
const Departments   = modelsImport.Departments;
const Groups        = modelsImport.Groups;
const Message       = modelsImport.Message;
const Messages      = modelsImport.Messages;
const Notifications = modelsImport.Notifications;
const Organizations = modelsImport.Organizations;
const Templates     = modelsImport.Templates;


// Twilio library tools and secrets
const credentials     = require("../../credentials");
const ACCOUNT_SID     = credentials.accountSid;
const AUTH_TOKEN      = credentials.authToken;
const twilio          = require("twilio");
const twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// Outside library requires
var moment    = require("moment");
var moment_tz = require("moment-timezone");


// General error handling
const errorHandling = require("./utilities/errorHandling");
const error_500     = errorHandling.error_500;
const notFound      = errorHandling.notFound;

// Internal utilities
var logging                 = require("./utilities/logging");
var logClientActivity       = logging.logClientActivity;
var logConversationActivity = logging.logConversationActivity;


// Standard checks for every role, no matter
// Add flash alerts
router.use((req, res, next) => {
  Alerts.findByUser(req.user.cmid)
  .then((alerts) => {
    res.locals.ALERTS_FEED = alerts;
    next();
  }).catch(error_500(res));
});

// Add organization
router.use((req, res, next) => {
  Organizations.findByID(req.user.org)
  .then((org) => {
    res.locals.organization = org;
    next();
  }).catch(error_500(res));
});

// Add department
router.use((req, res, next) => {
  Departments.findByID(req.user.department)
  .then((department) => {
    // if no department, provide some dummy attributes
    if (!department) {
      department = {
        name:         "Unassigned",
        phone_number: null,
        organization: req.user.org
      }
    }
    res.locals.department = department;
    next();
  }).catch(error_500(res));
});

// Reroute from standard drop endpoint
router.get("/", (req, res) => {
  console.log("HIHI");
  if (["owner", "supervisor", "support"].indexOf(req.user.class) > -1) {
    res.redirect(`/v4/dashboard`);
  } else if (["developer", "primary"].indexOf(req.user.class) > -1) {
    res.redirect(`/v4/clients`);
  } else {
    notFound(res);
  }
});


// ***
// NEW ROUTING STARTS HERE
// ***

router.get("/clients", (req, res) => {
  const managerID = Number(req.user.cmid);
  const state = req.query.state || "open";

  Clients.findByUsers(managerID, state == "open")
  .then((clients) => {
    res.render("v4/primary/clients", {
      hub: {
        tab: "clients",
        sel: state,
      },
      clients: clients
    });
  }).catch(error_500(res));
});

router.get("/clients/create", (req, res) => {
  res.render("v4/primary/client/create");
});

router.post("/clients/create", (req, res) => {
  let userID = req.user.cmid;
  let first  = req.body.first;
  let middle = req.body.middle ? req.body.middle : "";
  let last   = req.body.last;
  let dob    = req.body.DOB;
  let so     = req.body.uniqueID1 ? req.body.uniqueID1 : null;
  let otn    = req.body.uniqueID2 ? req.body.uniqueID2 : null;

  Client.create(
          userID, 
          first, 
          middle, 
          last, 
          dob, 
          otn, 
          so
  ).then(() => {
    res.redirect(`/v4/clients`);
  }).catch(error_500(res));
});

router.get("/clients/client/:clientID/address", (req, res) => {
  Client.findByID(req.params.clientID)
  .then((client) => {
    if (client) {
      res.render("v4/primary/client/address", {
        client: client,
        template: req.query
      });

    } else {
      notFound(res);
    }
  }).catch(error_500(res));
});

router.get("/clients/client/:clientID/address/templates", (req, res) => {
  Templates.findByUser(req.user.cmid)
  .then((templates) => {
    res.render("v4/primary/client/templates", {
      templates: templates,
      parameters: req.params
    });
  }).catch(error_500(res));
});

router.post("/clients/client/:clientID/address", (req, res) => {
  let userID   = req.user.cmid;
  let clientID = Number(req.params.clientID);
  let subject  = req.body.subject;
  let content  = req.body.content;
  let commID   = req.body.commID == "null" ? null : req.body.commID;
  let method;

  if (commID) {
    method = Messages.startNewConversation(userID, clientID, subject, content, commID);
  } else {
    method = Messages.smartSend(userID, clientID, subject, content);
  }

  method.then(() => {
    req.flash("success", "Message to client sent.");
    res.redirect(`/v4/clients`);
  }).catch(error_500(res));
});

router.get("/clients/client/:clientID/alter/:activeStatus", (req, res) => {
  let activeStatus = req.params.activeStatus == "open";
  Client.alterCase(req.params.clientID, activeStatus)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Client case status changed.")
    res.redirect(`/v4/clients`);
  }).catch(error_500(res));
});


router.get("/notifications", (req, res) => {
  const status = req.query.status || "pending";
  let isSent = status == "sent";

  Notifications.findByUser(req.user.cmid, isSent)
  .then((notifications) => {
    res.render("v4/primary/notifications/notifications", {
      hub: {
        tab: "notifications",
        sel: status
      },
      notifications: notifications
    });
  }).catch(error_500(res));
});

router.get("/notifications/edit/:notificationID", (req, res) => {
  var clients;

  Clients.findAllByUser(req.user.cmid)
  .then((c) => {
    clients = c;

    return Notifications.findByID(Number(req.params.notificationID))
  }).then((n) => {
    if (n) {
      // Remove all closed clients except for if matches with notification
      clients = clients.filter((c) => { return c.active || c.clid == n.client; });

      res.render("v4/primary/notifications/edit", {
        notification: n,
        clients: clients
      });

    } else {
      notFound(res);
    }
  }).catch(error_500(res));
});

router.post("/notifications/edit/:notificationID", (req, res) => {
  let notificationID = req.params.notificationID;
  let clientID       = req.body.clientID;
  let commID         = req.body.commID ? req.body.commID : null;
  let subject        = req.body.subject;
  let message        = req.body.message;
  let send           = moment(req.body.sendDate)
                        .tz(res.locals.local_tz)
                        .add(Number(req.body.sendHour) - 1, "hours")
                        .format("YYYY-MM-DD HH:mm:ss");

  Notifications.editOne(
                  notificationID, 
                  clientID, 
                  commID, 
                  send, 
                  subject, 
                  message
  ).then(() => {
    req.flash("success", "Edited notification.");
    res.redirect(`/v4/notifications`);
  }).catch(error_500(res));
});

router.get("/notifications/create", (req, res) => {
  Clients.findByUser(req.user.cmid)
  .then((clients) => {
    res.render("v4/primary/notifications/create", {
      clients: clients
    })
  }).catch(error_500(res));
});

router.get("/notifications/create/compose", (req, res) => {
  res.render("v4/primary/notifications/compose", {
    parameters: req.query
  });
});

router.post("/notifications/create/compose", (req, res) => {
  res.render("v4/primary/notifications/compose", {
    parameters: req.body
  });
});

router.get("/notifications/create/templates", (req, res) => {
  Templates.findByUser(req.user.cmid)
  .then((templates) => {
    res.render("v4/primary/notifications/templates", {
      templates: templates,
      parameters: req.query
    });
  }).catch(error_500(res));
});

router.post("/notifications/create", (req, res) => {
  let userID   = req.user.cmid;
  let clientID = req.body.clientID;
  let commID   = req.body.commID == "" ? null : req.body.commID;
  let subject  = !req.body.subject ? "" : req.body.subject;
  let message  = req.body.message;
  let send     = moment(req.body.sendDate)
                  .tz(res.locals.local_tz)
                  .add(Number(req.body.sendHour) - 1, "hours")
                  .format("YYYY-MM-DD HH:mm:ss");

  Notifications.create(
                  userID, 
                  clientID, 
                  commID, 
                  subject, 
                  message, 
                  send
  ).then(() => {
    req.flash("success", "Created new notification.");
    res.redirect(`/v4/notifications`);
  }).catch(error_500(res));
});

router.get("/notifications/remove/:notificationID", (req, res) => {
  Notifications.removeOne(req.params.notificationID)
  .then(() => {
    req.flash("success", "Removed notification.");
    res.redirect(`/v4/notifications`);
  }).catch(error_500(res));
});

router.get("/templates", (req, res) => {
  Templates.findByUser(Number(req.user.cmid))
  .then((templates) => {
    res.render("v4/primary/templates/templates", {
      hub: {
        tab: "templates",
        sel: null
      },
      templates: templates
    });
  }).catch(error_500(res));
});

router.get("/templates/create", (req, res) => {
  res.render("v4/primary/templates/create");
});

router.post("/templates/create", (req, res) => {
  let orgID   = req.user.org;
  let userID  = req.user.cmid;
  let title   = req.body.title;
  let content = req.body.content;
  Templates.insertNew(orgID, userID, title, content)
  .then(() => {
    req.flash("success", "Created new template.")
    res.redirect(`/v4/templates`);
  }).catch(error_500(res));
});

router.get("/templates/remove/:templateID", (req, res) => {
  Templates.removeOne(req.params.templateID)
  .then(() => {
    req.flash("success", "Removed template.")
    res.redirect(`/v4/templates`);
  }).catch(error_500(res));
});

router.get("/templates/edit/:templateID", (req, res) => {
  Templates.findByID(req.params.templateID)
  .then((template) => {
    if (template) {
      res.render("v4/primary/templates/edit", {
        template: template
      });
    } else {
      res.redirect("/404")
    }
  }).catch(error_500(res));
});

router.post("/templates/edit/:templateID", (req, res) => {
  const templateID = req.params.templateID;
  const title   = req.body.title;
  const content = req.body.content;
  Templates.editOne(templateID, title, content)
  .then(() => {
    req.flash("success", "Template edited.")
    res.redirect(`/v4/templates`);
  }).catch(error_500(res));
});

router.get("/groups/address/:groupID", (req, res) => {
  res.render("v4/primary/groups/address", {
    parameters: req.params
  });
});

router.post("/groups/address/:groupID", (req, res) => {
  let userID = req.user.cmid;
  let groupID = Number(req.params.groupID);
  let title = req.body.title;
  let content = req.body.content;

  if (title == "") title = "New Conversation";

  Groups.addressMembers(userID, groupID, title, content)
  .then(() => {
    req.flash("success", "Messaged group members.");
    res.redirect(`${req.redirectUrlBase}/groups/current`);
  }).catch(error_500(res));
});

router.get("/groups", (req, res) => {
  let userID = req.user.cmid;
  let status = req.query.status || "current"
  let isCurrent = status == "current"

  Groups.findByUser(userID, isCurrent)
  .then((groups) => {
    res.render("v4/primary/groups/groups", {
      hub: {
        tab: "groups",
        sel: status
      },
      groups: groups
    });
  }).catch(error_500(res));
});

router.get("/groups/create", (req, res) => {
  Clients.findByUser(Number(req.user.cmid), true)
  .then((clients) => {
      res.render("v4/primary/groups/create", {
        clients: clients
      });
  }).catch(error_500(res));
});

router.post("/groups/create", (req, res) => {
  let userID = Number(req.user.cmid);
  let name = req.body.name;
  let clientIDs = req.body.clientIDs;
  Groups.insertNew(userID, name, clientIDs)
  .then(() => {
    req.flash("success", "Created new group.");
    res.redirect(`${req.redirectUrlBase}/groups/current`);
  }).catch(error_500(res));
});

router.get("/groups/edit/:groupID", (req, res) => {
  Groups.findByID(Number(req.params.groupID))
  .then((group) => {
    if (group) {
      Clients.findByUser(Number(req.user.cmid), true)
      .then((clients) => {
        res.render("v4/primary/groups/edit", {
          group: group,
          clients: clients
        });
      }).catch(error_500(res));
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});

router.post("/groups/edit/:groupID", (req, res) => {
  let userID = req.user.cmid;
  let groupID = req.params.groupID;
  let name = req.body.name;

  // Clean clientIDs
  let clientIDs = req.body.clientIDs;
  if (!clientIDs) clientIDs = [];
  if (typeof clientIDs == "string") clientIDs = isNaN(Number(clientIDs)) ? [] : Number(clientIDs);
  if (typeof clientIDs == "number") clientIDs = [clientIDs];
  if (Array.isArray(clientIDs)) {
    clientIDs
    .map(function (ID) { return Number(ID); })
    .filter(function (ID) { return !(isNaN(ID)); });
    Groups.editOne(userID, groupID, name, clientIDs)
    .then(() => {
      req.flash("success", "Edited group.");
      res.redirect(`/v4/groups`);
    }).catch(error_500(res));
  } else {
    res.redirect("/404");
  }
});

router.get("/groups/remove/:groupID", (req, res) => {
  Groups.removeOne(Number(req.params.groupID))
  .then(() => {
    res.redirect(`/v4/groups`);
  }).catch(error_500(res));
});

router.get("/groups/activate/:groupID", (req, res) => {
  Groups.activateOne(Number(req.params.groupID))
  .then(() => {
    res.redirect(`/v4/groups`);
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;

