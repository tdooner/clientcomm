

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
  req.redirectUrlBase = `/v4/orgs/${req.params.orgID}/users/${req.params.userID}/supervisor/department/${req.params.departmentID}`;
  next();
});


// ROUTES
router.get("/", function (req, res) {
    res.redirect(`${req.redirectUrlBase}/clients/client/${req.params.clientID}/messages`);
});


router.get("/closecase", function (req, res) {
  Client.alterCase(req.params.clientID, false)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Closed client case.")
    res.redirect(`${req.redirectUrlBase}/clients`);
  }).catch(error_500(res));
});


router.get("/opencase", function (req, res) {
  Client.alterCase(req.params.clientID, true)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Opened client case.")
    res.redirect(`${req.redirectUrlBase}/clients`);
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
    res.redirect(`${req.redirectUrlBase}/clients`);
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
        res.redirect(`${req.redirectUrlBase}/clients`);
      }).catch(error_500(res));
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});


router.get("/transcript_between/:targetUserID", function (req, res) {
  const clientID = req.params.clientID;
  const targetUserID = req.params.targetUserID;
  Messages.findByClientID(targetUserID, clientID)
  .then((messages) => {
    // Format into a text string
    messages = messages.map(function (m) {
      var s = "";
      Object.keys(m).forEach(function (k) {
        s += `\n${k}: ${m[k]}`;
      });
      return s;
    }).join("\n\n");
    res.set({"Content-Disposition":"attachment; filename=transcript.txt"});
    res.send(messages);
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;



