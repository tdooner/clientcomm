

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Notifications = modelsImport.Notifications;
const Templates     = modelsImport.Templates;
const Clients       = modelsImport.Clients;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;


// Access utilities
var accessChecking  = require("../../utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;

// DATETIME VARIABLES FOR EJS
var moment          = require("moment");
var moment_tz       = require("moment-timezone");


// GENERAL CHECK
router.get("/", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/primary/notifications/pending");
});

router.get("/pending", function (req, res) {
  Notifications.findByUser(req.user.cmid, false)
  .then((notifications) => {
    res.render("v4/primaryUser/notifications/notifications", {
      hub: {
        tab: "notifications",
        sel: "pending"
      },
      notifications: notifications
    });
  }).catch(error_500(res));
});

router.get("/sent", function (req, res) {
  Notifications.findByUser(req.user.cmid, true)
  .then((notifications) => {
    res.render("v4/primaryUser/notifications/notifications", {
      hub: {
        tab: "notifications",
        sel: "sent"
      },
      notifications: notifications
    });
  }).catch(error_500(res));
});

router.get("/edit/:notificationID", function (req, res) {
  var clients;
  Clients.findByUser(req.user.cmid)
  .then((clientsReturned) => {
    clients = clientsReturned;
    return Notifications.findByID(Number(req.params.notificationID))
  }).then((notification) => {
    if (notification) {
      res.render("v4/primaryUser/notifications/edit", {
        notification: notification,
        clients: clients
      });
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});

router.post("/edit/:notificationID", function (req, res) {
  const notificationID = req.params.notificationID;
  const clientID       = req.body.clientID;
  const commID         = req.body.commID;
  const subject        = req.body.subject;
  const message        = req.body.message;
  const send           = moment(req.body.sendDate)
                          .tz(res.locals.local_tz)
                          .add(Number(req.body.sendHour) - 1, "hours")
                          .format("YYYY-MM-DD HH:mm:ss");

  Notifications.editOne(notificationID, clientID, commID, send, subject, message)
  .then((notification) => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/notifications");
  }).catch(error_500(res));
});

router.get("/create", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/primary/notifications/create/sendto");
});

router.get("/create/sendto", function (req, res) {
  Clients.findByUser(req.user.cmid)
  .then((clients) => {
    res.render("v4/primaryUser/notifications/sendto", {
      clients: clients
    })
  }).catch(error_500(res));
});

router.get("/create/sendto/:clientID/via/:commID/on/:sendDate/at/:sendHour/selecttemplate", function (req, res) {
  Templates.findByUser(req.user.cmid)
  .then((templates) => {
    res.render("v4/primaryUser/notifications/selecttemplate", {
      templates: templates,
      parameters: req.params
    });
  }).catch(error_500(res));
});

router.get("/create/sendto/:clientID/via/:commID/on/:sendDate/at/:sendHour/selecttemplate/:templateID", function (req, res) {
  const templateID = Number(req.params.templateID);
  const userID = req.user.cmid;
  const clientID = Number(req.params.clientID);

  Templates.findByID(templateID)
  .then((template) => {
    if (template) {
      Templates.logUse(templateID, userID, clientID)
      .then(() => {
        req.params.subject = template.title;
        req.params.message = template.content;
        res.render("v4/primaryUser/notifications/create", {
          parameters: req.params
        });
      }).catch(error_500(res));
    } else {
      res.render("v4/primaryUser/notifications/create", {
        parameters: req.params
      });
    }
  }).catch(error_500(res));
});

router.get("/create/sendto/:clientID/via/:commID/on/:sendDate/at/:sendHour", function (req, res) {
  res.render("v4/primaryUser/notifications/create", {
    parameters: req.params
  });
});

router.post("/create/sendto/:clientID/via/:commID/on/:sendDate/at/:sendHour", function (req, res) {
  const userID = req.params.userID;
  const clientID = req.params.clientID;
  const commID = req.params.commID == "null" ? null : req.params.commID;
  const subject = !req.body.subject ? "" : req.body.subject;
  const message = req.body.message;
  const send = moment(req.params.sendDate)
              .tz(res.locals.local_tz)
              .add(Number(req.params.sendHour) - 1, "hours")
              .format("YYYY-MM-DD HH:mm:ss");

  Notifications.create(userID, clientID, commID, subject, message, send)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/notifications");
  }).catch(error_500(res));
});

router.get("/remove/:notificationID", function (req, res) {
  Notifications.removeOne(req.params.notificationID)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/notifications/pending");
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;


