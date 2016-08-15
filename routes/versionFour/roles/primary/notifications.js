

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Notifications = modelsImport.Notifications;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;


// Access utilities
var accessChecking  = require("../../utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;


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


