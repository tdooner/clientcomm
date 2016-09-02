

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport   = require("../../../../models/models");
const Client         = modelsImport.Client;
const ColorTags      = modelsImport.ColorTags;
const Conversations  = modelsImport.Conversations;
const Communications = modelsImport.Communications;
const Users          = modelsImport.Users;
const Notifications  = modelsImport.Notifications;
const Messages       = modelsImport.Messages;
const CommConns      = modelsImport.CommConns;
const Clients        = modelsImport.Clients;


// Twilio library tools and secrets
var credentials     = require("../../../../credentials");
var ACCOUNT_SID     = credentials.accountSid;
var AUTH_TOKEN      = credentials.authToken;
var twilio          = require("twilio");
var twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;

var logging                 = require("../../utilities/logging");
var logClientActivity       = logging.logClientActivity;
var logConversationActivity = logging.logConversationActivity;


// MUST PASS THROUGH
router.use(function (req, res, next) {
  Client.findByID(req.params.clientID)
  .then((client) => {
    if (client) {
      res.locals.client = client;
      next();
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});

// Create base URL for this page
router.use((req, res, next) => {
  res.locals.parameters = req.params;
  req.redirectUrlBase = `/v4/orgs/${req.params.orgID}/users/${req.params.userID}/supervisor/department/${req.params.departmentID}/clients/client/${req.params.clientID}`;
  next();
});


// ROUTES
router.get("/", function (req, res) {
    res.redirect(`${req.redirectUrlBase}/messages`);
});


router.get("/closecase", function (req, res) {
  Client.alterCase(req.params.clientID, false)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Closed client case.")
    res.redirect(`/v4/orgs/${req.params.orgID}/users/${req.params.userID}/supervisor/department/${req.params.departmentID}/clients`);
  }).catch(error_500(res));
});


router.get("/opencase", function (req, res) {
  Client.alterCase(req.params.clientID, true)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Opened client case.")
    res.redirect(`/v4/orgs/${req.params.orgID}/users/${req.params.userID}/supervisor/department/${req.params.departmentID}/clients`);
  }).catch(error_500(res));
});


router.get("/edit", function (req, res) {
  res.render("v4/supervisorUser/client/edit");
});


router.post("/edit", function (req, res) {
  const clientID = req.params.clientID;
  const first = req.body.first;
  const middle = req.body.middle;
  const last = req.body.last;
  const dob = req.body.dob;
  const uniqueID1 = req.body.uniqueID1;
  const uniqueID2 = req.body.uniqueID2;
  Client.editOne(clientID, first, middle, last, dob, uniqueID1, uniqueID2)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Edited client.")
    res.redirect(`/v4/orgs/${req.params.orgID}/users/${req.params.userID}/supervisor/department/${req.params.departmentID}/clients`);
  }).catch(error_500(res));
});


router.get("/editcolortag", function (req, res) {
  ColorTags.selectAllByUser(res.locals.client.cm)
  .then((colorTags) => {
    res.render("v4/supervisorUser/client/selectcolor", {
      colorTags: colorTags,
    });
  }).catch(error_500(res));
});


router.get("/transfer", function (req, res) {
  var allDepartments = req.query.allDepartments == "true" ? true : false;
  Users.findByOrg(req.user.org)
  .then((users) => {
    users = users.filter(function (user) {
      return allDepartments || user.department == req.user.department;
    });

    res.render("v4/supervisorUser/client/transfer", {
      users: users,
      parameters: req.params,
      allDepartments: allDepartments
    });
  }).catch(error_500(res));
});


router.post("/transfer", function (req, res) {
  var fromUserID = null;
  const toUserID = Number(req.body.userID);
  const clientID = Number(req.params.clientID);
  const bundleConversations = req.params.bundleConversations ? true : false;

  Client.findByID(clientID)
  .then((client) => {
    if (client) fromUserID = client.cm;
    return Users.findByID(toUserID)
  }).then((user) => {
    if (user && user.active) {
      Client.transfer(clientID, fromUserID, toUserID, bundleConversations)
      .then(() => {
        logClientActivity(req.params.clientID);
        req.flash("success", "Client transferred.")
        res.redirect(`/v4/orgs/${req.params.orgID}/users/${req.params.userID}/supervisor/department/${req.params.departmentID}/clients`);
      }).catch(error_500(res));
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});


router.get("/messages", function (req, res) {
  res.redirect(`${req.redirectUrlBase}/messages/filter/all`);
});

router.get("/messages/filter/:method", function (req, res) {
  var methodFilter = "all";
  if (req.params.method == "texts") methodFilter = "cell";

  var conversationFilterID = Number(req.query.conversation);
  if (isNaN(conversationFilterID)) conversationFilterID = null;

  var conversations, messages;
  Conversations.findByUserAndClient(req.user.cmid, req.params.clientID)
  .then((convos) => {
    conversations = convos;
    return Messages.findByClientID(req.user.cmid, req.params.clientID)
  }).then((msgs) => {
    messages = msgs.filter(function (msg) {
      if (msg.comm_type == methodFilter || methodFilter == "all") {
        if (msg.convo == conversationFilterID || conversationFilterID == null) {
          return true;
        } else { return false; }
      } else { return false; }
    });
    return CommConns.findByClientID(req.params.clientID)
  }).then((communications) => {
    res.render("v4/supervisorUser/client/messages", {
      hub: {
        tab: "messages",
        sel: req.params.method
      },
      conversations: conversations,
      messages: messages,
      communications: communications,
      conversationFilterID: conversationFilterID
    });
  }).catch(error_500(res));
});


router.post("/messages/create/infer_conversation", function (req, res) {
  const userID = req.user.cmid;
  const clientID = Number(req.params.clientID);
  const subject = "New Conversation";
  const content = req.body.content;
  const commID = req.body.commID;

  Conversations.getMostRecentConversation(userID, clientID)
  .then((conversation) => {
    // use existing conversation if exists and recent (5 days)
    var now, lastUpdated, recentOkay = false;
    if (conversation) {
      now = new Date().getTime() - (5 * 24 * 60 * 60 * 1000); // 5 days in past
      lastUpdated = new Date(conversation.updated).getTime();
      recentOkay = lastUpdated > now;
    }

    if (conversation && recentOkay) {
      Messages.sendOne(commID, content, conversation.convid)
      .then(() => {
        logClientActivity(req.params.clientID);
        logConversationActivity(conversation.convid);
        res.redirect(`${req.redirectUrlBase}/messages`);
      }).catch(error_500(res));
    
    //otherwise create a new conversation
    } else {
      Conversations.create(userID, clientID, subject, true)
      .then((conversationID) => {
        return Messages.sendOne(commID, content, conversationID)
      }).then(() => {
        logClientActivity(req.params.clientID);
        res.redirect(`${req.redirectUrlBase}/messages`);
      }).catch(error_500(res));
    }
  }).catch(error_500(res));
});


router.get("/conversations/create", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/supervisor/department/" + req.user.department + 
                "/clients/address/" + 
                req.params.clientID);
});


router.get("/notifications", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/supervisor/department/" + req.user.department + 
                "/clients/client/" + 
                req.params.clientID + 
                "/notifications/pending");
});


router.get("/notifications/pending", function (req, res) {
  Notifications.findByClientID(req.params.clientID, false)
  .then((notifications) => {
    res.render("v4/supervisorUser/client/notifications", {
      hub: {
        tab: "notifications",
        sel: "pending"
      },
      notifications: notifications
    });
  }).catch(error_500(res));
});


router.get("/notifications/sent", function (req, res) {
  Notifications.findByClientID(req.params.clientID, true)
  .then((notifications) => {
    res.render("v4/supervisorUser/client/notifications", {
      hub: {
        tab: "notifications",
        sel: "sent"
      },
      notifications: notifications
    });
  }).catch(error_500(res));
});


router.get("/notifications/remove/:notificationID", function (req, res) {
  Notifications.removeOne(req.params.notificationID)
  .then(() => {
    req.flash("success", "Removed notification.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/supervisor/department/" + req.user.department + 
                  "/clients/client/" + 
                  req.params.clientID + 
                  "/notifications");
  }).catch(error_500(res));
});


router.get("/notifications/create", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/supervisor/department/" + req.user.department + 
                "/notifications/create/sendto");
});


router.get("/communications", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/supervisor/department/" + req.user.department + 
                "/clients/client/" + 
                req.params.clientID + 
                "/communications/filter/open");
});


router.get("/communications/filter/open", function (req, res) {
  CommConns.getClientCommunications(req.params.clientID)
  .then((communications) => {
    res.render("v4/supervisorUser/client/communications", {
      hub: {
        tab: "contactMethods",
        sel: null
      },
      communications: communications
    });
  }).catch(error_500(res));
});


router.get("/communications/remove/:communicationID", function (req, res) {
  CommConns.findByClientID(req.params.clientID)
  .then((commConns) => {
    if (commConns.length > 1) {
      Communications.removeOne(req.params.communicationID)
      .then((communications) => {
        req.flash("success", "Removed communication method.");
        res.redirect( "/v4/users/" + 
                      req.user.cmid + 
                      "/supervisor/department/" + req.user.department + 
                      "/clients/client/" + 
                      req.params.clientID + 
                      "/communications/");
      }).catch(error_500(res));
    } else {
      req.flash("warning", "Can't remove the only remaining communication method.");
      res.redirect( "/v4/users/" + 
                    req.user.cmid + 
                    "/supervisor/department/" + req.user.department + 
                    "/clients/client/" + 
                    req.params.clientID + 
                    "/communications");
    }
  })
});


router.get("/communications/create", function (req, res) {
  res.render("v4/supervisorUser/client/createComm", {
    commConn: {}
  });
});


router.post("/communications/create", function (req, res) {
  const clientID = req.params.clientID;
  const name = req.body.description;
  const type = req.body.type;
  var   value = req.body.value;

  // clean up numbers
  if (type == "cell" || type == "landline") {
    value = value.replace(/[^0-9.]/g, "");
    if (value.length == 10) { value = "1" + value; }
  }
  CommConns.createOne(clientID, type, name, value)
  .then(() => {
    req.flash("success", "Created new communication method.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/supervisor/department/" + req.user.department + 
                  "/clients/client/" + 
                  req.params.clientID + 
                  "/communications/");
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;


