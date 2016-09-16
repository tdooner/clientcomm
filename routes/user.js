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
    let clientId = req.params.clientId || req.params.clientID || null;
    let status = req.query.status || "pending";
    let isSent = status === "sent";
    let strategy;

    if (clientId) {
      strategy = Notifications.findByClientID(clientId, isSent)
    } else {
      strategy = Notifications.findByUser(req.user.cmid, isSent);
    }
    
    strategy.then((n) => {
      res.render("notifications/index", {
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

        res.render("notifications/edit", {
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
  let status = req.query.status === "closed" ? false : true;

  Clients.findByUsers(req.user.cmid, status)
  .then((clients) => {
    res.render("clients/index", {
      hub: {
        tab: "clients",
        sel: status ? "open" : "closed",
      },
      clients: clients
    });
  }).catch(error500(res));  
});

router.get("/clients/create", (req, res) => {
  res.render("clients/create", { users: null });
});

router.post("/clients/create", (req, res) => {
  let userId = req.user.cmid;    
  let first  = req.body.first;    
  let middle = req.body.middle ? req.body.middle : "";    
  let last   = req.body.last;   
  let dob    = req.body.dob;    
  let so     = req.body.uniqueID1 ? req.body.uniqueID1 : null;    
  let otn    = req.body.uniqueID2 ? req.body.uniqueID2 : null;
  Client.create(
          userId, 
          first, 
          middle, 
          last, 
          dob, 
          so, 
          otn
  ).then(() => {
    res.redirect(`/clients`);
  }).catch(error500(res));
});

// For all /clients/:clientId, include local obj. client
router.use("/clients/:clientId", (req, res, next) => {
  Client.findByID(req.params.clientId)
  .then((c) => {
    if (c) {
      res.locals.client = c;
      next();
    } else {
      notFound(res);
    }
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
      res.render("clients/edit", {
        client: client
      });
    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

router.post("/clients/:clientId/edit", (req, res) => {
  let clientId  = req.params.clientId;
  let first     = req.body.first;
  let middle    = req.body.middle;
  let last      = req.body.last;
  let dob       = req.body.dob;
  let so        = req.body.uniqueID1;
  let otn       = req.body.uniqueID2;
  Client.editOne(
          clientId, 
          first, 
          middle, 
          last, 
          dob, 
          so, 
          otn
  ).then(() => {
    logClientActivity(req.params.clientId);
    req.flash("success", "Edited client.");
    res.redirect(`/clients`);
  }).catch(error500(res));
});

router.get("/clients/:clientID/edit/color", (req, res) => {
  ColorTags.selectAllByUser(req.user.cmid)
  .then((colors) => {
    if (colors.length > 0) {
      res.render("clients/colors", {
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
    res.render("clients/messages", {
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

router.get("/clients/:clientId/communications", (req, res) => {
  CommConns.getClientCommunications(req.params.clientId)
  .then((c) => {
    if (c.length == 0) {
      res.redirect(`/clients/${req.params.clientId}/communications/create`);
    } else {
      res.render("clients/communications", {
        hub: {
          tab: "contactMethods",
          sel: null
        },
        communications: c
      });
    }
  }).catch(error500(res));
});

router.get("/clients/:clientId/communications/create", (req, res) => {
  res.render("clients/commConn")
});

router.post("/clients/:clientId/communications/create", (req, res) => {
  let clientId = req.params.clientId;
  let name     = req.body.description;
  let type     = req.body.type;
  let value    = req.body.value;

  // clean up numbers
  if (type == "cell" || type == "landline") {
    value = value.replace(/[^0-9.]/g, "");
    if (value.length == 10) { value = "1" + value; }
  }

  CommConns.createOne(clientId, type, name, value)
  .then(() => {
    logClientActivity(clientId);
    req.flash("success", "Created new communication method.");
    res.redirect(`/clients/${clientId}/communications`);
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

    res.render("clients/transfer", {
      users: users,
      allDepartments: allDep
    });
  }).catch(error500(res));
});

router.post("/clients/:clientId/transfer", (req, res) => {
  const fromUserID = req.user.cmid;
  const toUserID   = req.body.userID;
  const clientId   = req.params.clientId;
  const bundleConv = req.params.bundleConversations ? true : false;

  Users.findByID(toUserID)
  .then((user) => {
    if (user && user.active) {
      Client.transfer(clientId, fromUserID, toUserID, bundleConv)
      .then(() => {
        logClientActivity(clientId);
        res.redirect(`/clients`);
      }).catch(error500(res));

    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

router.get("/clients/:clientId/transcript", (req, res) => {
  let withUser = req.query.with || null;
  Messages.findByClientID(withUser, req.params.clientId)
  .then((messages) => {
    
    // Format into a text string
    messages = messages.map(function (m) {
      let s = "";
      Object.keys(m).forEach(function (k) { s += `\n${k}: ${m[k]}`; });
      return s;
    }).join("\n\n");

    // Note: this does not render a new page, just initiates a download
    res.set({"Content-Disposition":"attachment; filename=transcript.txt"});
    res.send(messages);
  }).catch(error500(res));
});



module.exports = router;


