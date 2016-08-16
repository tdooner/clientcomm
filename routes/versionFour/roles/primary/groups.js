

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Groups        = modelsImport.Groups;


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
                "/primary/groups/current");
});


router.get("/current", function (req, res) {
  Groups.findByUser(Number(req.params.userID), true)
  .then((groups) => {
    res.render("v4/primaryUser/groups/groups", {
      hub: {
        tab: "groups",
        sel: "current"
      },
      groups: groups
    });
  }).catch(error_500(res));
});


router.get("/deleted", function (req, res) {
  Groups.findByUser(Number(req.params.userID), false)
  .then((groups) => {
    res.render("v4/primaryUser/groups/groups", {
      hub: {
        tab: "groups",
        sel: "deleted"
      },
      groups: groups
    });
  }).catch(error_500(res));
});

router.get("/edit/:groupID", function (req, res) {
  Groups.findByID(Number(req.params.groupID))
  .then((group) => {
    if (group) {
      res.render("v4/primaryUser/groups/edit", {
        group: group
      });
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});

router.post("/edit/:groupID", function (req, res) {
  Groups.editOne(Number(req.params.groupID), req.body.name)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/groups/current");
  }).catch(error_500(res));
});

router.get("/remove/:groupID", function (req, res) {
  Groups.removeOne(Number(req.params.groupID))
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/groups/current");
  }).catch(error_500(res));
});

router.get("/activate/:groupID", function (req, res) {
  Groups.activateOne(Number(req.params.groupID))
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/groups/deleted");
  }).catch(error_500(res));
});

// EXPORT ROUTER OBJECt
module.exports = router;


