

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Client        = modelsImport.Client;
const ColorTags     = modelsImport.ColorTags;
const Conversations = modelsImport.Conversations;
const Users         = modelsImport.Users;
const Notifications = modelsImport.Notifications;
const Messages      = modelsImport.Messages;
const CommConns     = modelsImport.CommConns;


// Twilio library tools and secrets
var credentials     = require("../../../../credentials");
var ACCOUNT_SID     = credentials.accountSid;
var AUTH_TOKEN      = credentials.authToken;
var twilio          = require("twilio");
var twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;


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


// ROUTES
router.get("/", function (req, res) {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/client/" + 
                  req.params.clientID + 
                  "/messages");
});


router.get("/closecase", function (req, res) {
  Client.alterCase(req.params.clientID, false)
  .then(() => {
    req.flash("success", "Closed client case.")
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/open");
  }).catch(error_500(res));
});


router.get("/opencase", function (req, res) {
  Client.alterCase(req.params.clientID, true)
  .then(() => {
    req.flash("success", "Opened client case.")
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/open");
  }).catch(error_500(res));
});


router.get("/edit", function (req, res) {
  res.render("v4/primaryUser/client/edit");
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
    req.flash("success", "Edited client.")
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/client/" + 
                  clientID + 
                  "/");
  }).catch(error_500(res));
});


router.get("/editcolortag", function (req, res) {
  ColorTags.selectAllByUser(req.user.cmid)
  .then((colorTags) => {
    if (colorTags.length > 0) {
      res.render("v4/primaryUser/client/selectcolor", {
        colorTags: colorTags,
      });
    } else {
      res.redirect( "/v4/users/" + 
                    req.user.cmid + 
                    "/primary/colortags");
    }
  }).catch(error_500(res));
});


router.post("/editcolortag", function (req, res) {
  var colorTagID = req.body.colorTagID;
  if (colorTagID == "") colorTagID = null
  Client.udpateColorTag(req.params.clientID, colorTagID)
  .then(() => {
    req.flash("success", "Changed client color.")
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/open");
  }).catch(error_500(res));
});


router.get("/transfer", function (req, res) {
  Users.findByOrg(req.user.org)
  .then((users) => {

    // limit only to same department transfers
    users = users.filter(function (user) {
      return user.department == req.user.department;
    });

    res.render("v4/primaryUser/client/transfer", {
      users: users,
      parameters: req.params
    });
  }).catch(error_500(res));
});


router.post("/transfer", function (req, res) {
  const fromUserID = req.user.cmid;
  const toUserID = Number(req.body.userID);
  const clientID = Number(req.params.clientID);
  const bundleConversations = req.params.bundleConversations ? true : false;
  Users.findByID(toUserID)
  .then((user) => {
    if (user) {
      Client.transfer(clientID, fromUserID, toUserID, bundleConversations)
      .then(() => {
        res.redirect( "/v4/users/" + 
                      req.user.cmid + 
                      "/primary/clients/open");
      }).catch(error_500(res));
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});


router.get("/messages", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/primary/clients/client/" + 
                req.params.clientID + 
                "/messages/filter/all");
});

router.get("/messages/filter/:method", function (req, res) {
  var methodFilter = "all";
  if (req.params.method == "texts") methodFilter = "cell";

  var conversationFilterID = Number(req.query.conversation);
  if (isNaN(conversationFilterID)) conversationFilterID = null;

  var conversations, messages;
  Conversations.findByUser(req.user.cmid)
  .then((convos) => {
    conversations = convos;
    return Messages.findByClient(req.user.cmid)
  }).then((msgs) => {
    messages = msgs.filter(function (msg) {
      if (msg.comm_type == methodFilter || methodFilter == "all") {
        if (msg.convo == conversationFilterID || conversationFilterID == null) {
          return true;
        } else { return false; }
      } else { return false; }
    });
    return CommConns.findByClientID(req.user.cmid)
  }).then((communications) => {
    res.render("v4/primaryUser/client/messages", {
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


router.get("/notifications/pending", function (req, res) {
  Notifications.findByClient(req.params.clientID)
  .then((notifications) => {
      res.send(notifications);
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;




