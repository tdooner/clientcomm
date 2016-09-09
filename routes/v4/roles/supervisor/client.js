

// (Sub) router
let express         = require("express");
let router          = express.Router({mergeParams: true});


// Models
let modelsImport   = require("../../../../models/models");
let Client         = modelsImport.Client;
let ColorTags      = modelsImport.ColorTags;
let Conversations  = modelsImport.Conversations;
let Communications = modelsImport.Communications;
let Users          = modelsImport.Users;
let Notifications  = modelsImport.Notifications;
let Messages       = modelsImport.Messages;
let CommConns      = modelsImport.CommConns;
let Clients        = modelsImport.Clients;


// Twilio library tools and secrets
let credentials     = require("../../../../credentials");
let ACCOUNT_SID     = credentials.accountSid;
let AUTH_TOKEN      = credentials.authToken;
let twilio          = require("twilio");
let twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// General error handling
let errorHandling   = require("../../utilities/errorHandling");
let error500       = errorHandling.error500;

let logging                 = require("../../utilities/logging");
let logClientActivity       = logging.logClientActivity;
let logConversationActivity = logging.logConversationActivity;


// MUST PASS THROUGH
router.use(function (req, res, next) {
  Client.findByID(req.params.clientID)
  .then((client) => {
    if (client) {
      res.locals.client = client;
      next();
    } else {
      notFound(res);
    }
  }).catch(error500(res));
});

// Create base URL for this page
router.use((req, res, next) => {
  res.locals.parameters = req.params;
  req.redirectUrlBase = `/v4/orgs/${req.user.org}/users/${req.user.cmid}/supervisor/department/${req.params.departmentID}`;
  next();
});


// ROUTES
router.get("/client/", (req, res) => {
    res.redirect(`/v4/clients/client/${req.params.clientID}/messages`);
});


router.get("/client/closecase", (req, res) => {
  Client.alterCase(req.params.clientID, false)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Closed client case.")
    res.redirect(`/v4/clients`);
  }).catch(error500(res));
});


router.get("/client/opencase", (req, res) => {
  Client.alterCase(req.params.clientID, true)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Opened client case.")
    res.redirect(`/v4/clients`);
  }).catch(error500(res));
});


router.get("/client/edit", (req, res) => {
  res.render("v4/supervisor/client/edit");
});


router.post("/client/edit", (req, res) => {
  let clientID = req.params.clientID;
  let first = req.body.first;
  let middle = req.body.middle;
  let last = req.body.last;
  let dob = req.body.dob;
  let uniqueID1 = req.body.uniqueID1;
  let uniqueID2 = req.body.uniqueID2;
  Client.editOne(clientID, first, middle, last, dob, uniqueID1, uniqueID2)
  .then(() => {
    logClientActivity(req.params.clientID);
    req.flash("success", "Edited client.")
    res.redirect(`/v4/clients`);
  }).catch(error500(res));
});


router.get("/client/editcolortag", (req, res) => {
  ColorTags.selectAllByUser(res.locals.client.cm)
  .then((colorTags) => {
    res.render("v4/supervisor/client/selectcolor", {
      colorTags: colorTags,
    });
  }).catch(error500(res));
});


router.get("/client/transfer", (req, res) => {
  let allDepartments = req.query.allDepartments == "true" ? true : false;
  Users.findByOrg(req.user.org)
  .then((users) => {
    users = users.filter(function (user) {
      return allDepartments || user.department == req.user.department;
    });

    res.render("v4/supervisor/client/transfer", {
      users: users,
      parameters: req.params,
      allDepartments: allDepartments
    });
  }).catch(error500(res));
});


router.post("/client/transfer", (req, res) => {
  let fromUserID = null;
  let toUserID = Number(req.body.userID);
  let clientID = Number(req.params.clientID);
  let bundleConversations = req.params.bundleConversations ? true : false;

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
        res.redirect(`/v4/clients`);
      }).catch(error500(res));
    } else {
      notFound(res);
    }
  }).catch(error500(res));
});


router.get("/client/transcript_between/:targetUserID", (req, res) => {

});


// EXPORT ROUTER OBJECt
module.exports = router;



