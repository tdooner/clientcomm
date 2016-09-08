'use strict';

// (Sub) router
const express         = require("express");
const router          = express.Router({mergeParams: true});

// Models
const modelsImport   = require("../models/models");
const Alerts         = modelsImport.Alerts;
const Client         = modelsImport.Client;
const Clients        = modelsImport.Clients;
const ColorTags      = modelsImport.ColorTags;
const Communication  = modelsImport.Communication;
const Communications = modelsImport.Communications;
const CommConns      = modelsImport.CommConns;
const Convo          = modelsImport.Convo;
const Conversations  = modelsImport.Conversations;
const Departments    = modelsImport.Departments;
const Groups         = modelsImport.Groups;
const Message        = modelsImport.Message;
const Messages       = modelsImport.Messages;
const Notifications  = modelsImport.Notifications;
const Organizations  = modelsImport.Organizations;
const Templates      = modelsImport.Templates;
const Users          = modelsImport.Users;


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


router.use((req, res, next) => {
  res.locals.level = "user"
  next();
})

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
        name:         "Unassigned",
        phone_number: null,
        organization: req.user.org
      }
    }
    res.locals.department = department;
    next();
  }).catch(error500(res));
});


// ***
// NEW ROUTING UTILITIES
// ***

class NotificationsView {
  
  static show (req, res) {
    let clientID = req.params.clientID;
    let status = req.query.status || "pending";
    let isSent = status === "sent";
    let strategy;

    if (clientID) {
      strategy = Notifications.findByClientID(clientID, isSent)
    } else {
      strategy = Notifications.findByUser(req.user.cmid, isSent);
    }
    
    strategy.then((n) => {
      let toRender;
      if (clientID) toRender = "v4/primary/client/notifications"
      else          toRender = "v4/primary/notifications/notifications";;
      res.render(toRender, {
        hub: {
          tab: "notifications",
          sel: status
        },
        notifications: n
      });
    }).catch(error500(res));
  }

  static remove (req, res) {
    let clientID = req.params.clientID;
    Notifications.removeOne(req.params.notificationID)
    .then(() => {
      req.flash("success", "Removed notification.");
      if (clientID) toRedirect = res.redirect(`/clients/${clientID}/notifications`);
      else          toRedirect = res.redirect(`/notifications`);
    }).catch(error500(res));
  }

  static editGet (req, res) {
    var clients;
    Clients.findAllByUser(req.user.cmid)
    .then((c) => {
      clients = c;

      return Notifications.findByID(Number(req.params.notificationID))
    }).then((n) => {
      if (n) {
        // Remove all closed clients except for if matches with notification
        clients = clients.filter((c) => { return c.active || c.clid === n.client; });

        res.render("v4/primary/notifications/edit", {
          notification: n,
          clients: clients
        });

      } else {
        notFound(res);
      }
    }).catch(error500(res));
  }

  static editPost (req, res) {
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
      if (req.params.clientID) {
        res.redirect(`/clients/${clientID}/notifications`);
      } else {
        res.redirect(`/notifications`);
      }
    }).catch(error500(res));
  }

}

// Ensure user exists
router.use((req, res, next) => {
  if (!req.hasOwnProperty("user")) { 
    res.status(400).send("not allowed") 
  } else {
    next()
  }
})

router.get("/clients", (req, res) => {
  const managerID = Number(req.user.cmid);
  const state = req.query.state || "open";

  Clients.findByUsers(managerID, state === "open")
  .then((clients) => {
    res.render("v4/primary/clients", {
      hub: {
        tab: "clients",
        sel: state,
      },
      clients: clients
    });
  }).catch(error500(res));  
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
    res.redirect(`/clients`);
  }).catch(error500(res));
});

// For all /clients/:clientID, include local obj. client
router.use("/clients/:clientID", (req, res, next) => {
  Client.findByID(req.params.clientID)
  .then((c) => {
    if (c) {
      res.locals.client = c;
      next();
    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

router.get("/clients/:clientID/address", (req, res) => {
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
  }).catch(error500(res));
});

router.get("/clients/:clientID/address/templates", (req, res) => {
  Templates.findByUser(req.user.cmid)
  .then((templates) => {
    res.render("v4/primary/client/templates", {
      templates: templates,
      parameters: req.params
    });
  }).catch(error500(res));
});

router.post("/clients/:clientID/address", (req, res) => {
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
    logClientActivity(clientID);
    req.flash("success", "Message to client sent.");
    res.redirect(`/clients/${clientID}/messages`);
  }).catch(error500(res));
});

router.get("/clients/:clientID/alter/:activeStatus", (req, res) => {
  let activeStatus = req.params.activeStatus == "open";
  Client.alterCase(req.params.clientID, activeStatus)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Client case status changed.")
    res.redirect(`/clients`);
  }).catch(error500(res));
});

router.get("/clients/:clientID/edit", (req, res) => {
  Client.findByID(req.params.clientID)
  .then((client) => {
    if (client) {
      res.render("v4/primary/client/edit", {
        client: client
      });
    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

router.post("/clients/:clientID/edit", (req, res) => {
  const clientID  = req.params.clientID;
  const first     = req.body.first;
  const middle    = req.body.middle;
  const last      = req.body.last;
  const dob       = req.body.dob;
  const uniqueID1 = req.body.uniqueID1;
  const uniqueID2 = req.body.uniqueID2;
  Client.editOne(
          clientID, 
          first, 
          middle, 
          last, 
          dob, 
          uniqueID1, 
          uniqueID2
  ).then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Edited client.");
    res.redirect(`/clients`);
  }).catch(error500(res));
});

router.get("/clients/:clientID/edit/color", (req, res) => {
  ColorTags.selectAllByUser(req.user.cmid)
  .then((colors) => {
    if (colors.length > 0) {
      res.render("v4/primary/client/colors", {
        colors: colors,
        params: req.params
      });
    } else {
      res.redirect(`/colors`);
    }
  }).catch(error500(res));
});

router.post("/clients/:clientID/edit/color", (req, res) => {
  let colorID = req.body.colorID == "" ? null : req.body.colorID;
  Client.udpateColorTag(req.params.clientID, colorID)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Changed client color.");
    res.redirect(`/clients`);
  }).catch(error500(res));
});

router.get("/clients/:clientID/messages", (req, res) => {
  let methodFilter = "all";
  if (req.query.method == "texts") methodFilter = "cell";

  let convoFilter = Number(req.query.conversation);
  if (isNaN(convoFilter)) convoFilter = null;

  let conversations, messages;
  Conversations.findByUserAndClient(req.user.cmid, req.params.clientID)
  .then((convos) => {
    conversations = convos;
    return Messages.findByClientID(req.user.cmid, req.params.clientID)
  }).then((msgs) => {
    messages = msgs.filter((msg) => {
      if (msg.comm_type == methodFilter || methodFilter == "all") {
        if (msg.convo == convoFilter || convoFilter == null) return true;
        else return false;

      } else { 
        return false; 
      }
    });
    return CommConns.findByClientID(req.params.clientID)
  }).then((communications) => {
    res.render("v4/primary/client/messages", {
      hub: {
        tab: "messages",
        sel: req.query.method ? req.query.method : "all"
      },
      conversations: conversations,
      messages: messages,
      communications: communications,
      convoFilter: convoFilter
    });
  }).catch(error500(res));
});

router.post("/clients/:clientID/messages", (req, res) => {
  const clientID = req.params.clientID;
  const subject  = "New Conversation";
  const content  = req.body.content;
  const commID   = req.body.commID;

  Conversations.getMostRecentConversation(req.user.cmid, clientID)
  .then((conversation) => {
    // Use existing conversation if exists and recent (lt 5 days)
    var now, lastUpdated, recentOkay = false;
    if (conversation) {
      now = new Date().getTime() - (5 * 24 * 60 * 60 * 1000); // 5 days in past
      lastUpdated = new Date(conversation.updated).getTime();
      recentOkay = lastUpdated > now;
    }

    if (conversation && recentOkay) {
      Messages.sendOne(commID, content, conversation.convid)
      .then(() => {
        logClientActivity(clientID);
        logConversationActivity(conversation.convid);
        res.redirect(`/clients/${clientID}/messages`);
      }).catch(error500(res));
    
    // Otherwise create a new conversation
    } else {
      Conversations.create(req.user.cmid, clientID, subject, true)
      .then((conversationID) => {
        return Messages.sendOne(commID, content, conversationID)
      }).then(() => {
        logClientActivity(clientID);
        res.redirect(`/clients/${clientID}/messages`);
      }).catch(error500(res));
    }
  }).catch(error500(res));
});

router.get("/clients/:clientID/communications", (req, res) => {
  CommConns.getClientCommunications(req.params.clientID)
  .then((c) => {
    res.render("v4/primary/client/communications", {
      hub: {
        tab: "contactMethods",
        sel: null
      },
      communications: c
    });
  }).catch(error500(res));
});

router.get("/clients/:clientID/communications/:communicationID/remove", (req, res) => {
  let clientID = req.params.clientID;
  CommConns.findByClientID(clientID)
  .then((commConns) => {
    if (commConns.length > 1) {
      Communications.removeOne(req.params.communicationID)
      .then(() => {
        req.flash("success", "Removed communication method.");
        res.redirect(`/clients/${clientID}/communications`);
      }).catch(error500(res));

    } else {
      req.flash("warning", "Can't remove the only remaining communication method.");
      res.redirect(`/clients/${clientID}/communications`);
    }
  })
});

router.get("/clients/:clientID/notifications", NotificationsView.show);

router.get("/clients/:clientID/notifications/:notificationID/remove", NotificationsView.remove);

router.get("/clients/:clientID/notifications/:notificationID/edit", NotificationsView.editGet);

router.post("/clients/:clientID/notifications/:notificationID/edit", NotificationsView.editPost);

router.post("/clients/:clientID/notifications/:notificationID/edit", NotificationsView.editPost);

router.get("/clients/:clientID/transfer", (req, res) => {
  let allDep = req.query.allDepartments == "true" ? true : false;
  Users.findByOrg(req.user.org)
  .then((users) => {
    // Limit only to same department transfers
    if (!allDep) users = users.filter((u) => { return u.department == req.user.department });

    res.render("v4/primary/client/transfer", {
      users: users,
      allDepartments: allDep
    });
  }).catch(error500(res));
});

router.post("/clients/:clientID/transfer", (req, res) => {
  const fromUserID = req.user.cmid;
  const toUserID   = req.body.userID;
  const clientID   = req.params.clientID;
  const bundleConv = req.params.bundleConversations ? true : false;

  Users.findByID(toUserID)
  .then((user) => {
    if (user && user.active) {
      Client.transfer(clientID, fromUserID, toUserID, bundleConv)
      .then(() => {
        logClientActivity(clientID);
        res.redirect(`/clients`);
      }).catch(error500(res));

    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

router.get("/colors", function (req, res) {
  ColorTags.selectAllByUser(req.user.cmid)
  .then((colors) => {
    res.render("v4/primary/colors", {
      colors: colors,
    });
  }).catch(error500(res));
});

router.post("/colors", function (req, res) {
  ColorTags.addNewColorTag(req.user.cmid, req.body.color, req.body.name)
  .then(() => {
    req.flash("success", "New color tag created.");
    res.redirect("/colors");
  }).catch(error500(res));
});

router.get("/colors/:colorID/remove", function (req, res) {
  ColorTags.removeColorTag(req.params.colorID)
  .then(() => {
    req.flash("success", "Color tag removed.");
    res.redirect("/colors");
  }).catch(error500(res));
});

router.get("/notifications", NotificationsView.show);

router.get("/notifications/create", (req, res) => {
  Clients.findByUser(req.user.cmid)
  .then((clients) => {
    res.render("v4/primary/notifications/create", {
      clients: clients
    })
  }).catch(error500(res));
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
  }).catch(error500(res));
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
    res.redirect(`/notifications`);
  }).catch(error500(res));
});

router.get("/notifications/:notificationID/edit", NotificationsView.editGet);

router.post("/notifications/:notificationID/edit", NotificationsView.editPost);

router.get("/notifications/:notificationID/remove", NotificationsView.remove);

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
  }).catch(error500(res));
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
    res.redirect(`/templates`);
  }).catch(error500(res));
});

router.get("/templates/remove/:templateID", (req, res) => {
  Templates.removeOne(req.params.templateID)
  .then(() => {
    req.flash("success", "Removed template.")
    res.redirect(`/templates`);
  }).catch(error500(res));
});

router.get("/templates/edit/:templateID", (req, res) => {
  Templates.findByID(req.params.templateID)
  .then((template) => {
    if (template) {
      res.render("v4/primary/templates/edit", {
        template: template
      });
    } else {
      notFound(res)
    }
  }).catch(error500(res));
});

router.post("/templates/edit/:templateID", (req, res) => {
  const templateID = req.params.templateID;
  const title   = req.body.title;
  const content = req.body.content;
  Templates.editOne(templateID, title, content)
  .then(() => {
    req.flash("success", "Template edited.")
    res.redirect(`/templates`);
  }).catch(error500(res));
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
  }).catch(error500(res));
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
  }).catch(error500(res));
});

router.get("/groups/create", (req, res) => {
  Clients.findByUser(Number(req.user.cmid), true)
  .then((clients) => {
      res.render("v4/primary/groups/create", {
        clients: clients
      });
  }).catch(error500(res));
});

router.post("/groups/create", (req, res) => {
  let userID = Number(req.user.cmid);
  let name = req.body.name;
  let clientIDs = req.body.clientIDs;
  Groups.insertNew(userID, name, clientIDs)
  .then(() => {
    req.flash("success", "Created new group.");
    res.redirect(`${req.redirectUrlBase}/groups/current`);
  }).catch(error500(res));
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
      }).catch(error500(res));
    } else {
      notFound(res);
    }
  }).catch(error500(res));
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
      res.redirect(`/groups`);
    }).catch(error500(res));
  } else {
    notFound(res);
  }
});

router.get("/groups/remove/:groupID", (req, res) => {
  Groups.removeOne(Number(req.params.groupID))
  .then(() => {
    res.redirect(`/groups`);
  }).catch(error500(res));
});

router.get("/groups/activate/:groupID", (req, res) => {
  Groups.activateOne(Number(req.params.groupID))
  .then(() => {
    res.redirect(`/groups`);
  }).catch(error500(res));
});



module.exports = router;


