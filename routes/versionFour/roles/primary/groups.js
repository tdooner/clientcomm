

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Groups        = modelsImport.Groups;
const Clients       = modelsImport.Clients;


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

router.get("/create", function (req, res) {
  Clients.findByUser(Number(req.params.userID), true)
  .then((clients) => {
      res.render("v4/primaryUser/groups/create", {
        clients: clients
      });
  }).catch(error_500(res));
});

router.post("/create", function (req, res) {
  const userID = Number(req.params.userID);
  const name = req.body.name;
  const clientIDs = req.body.clientIDs;
  Groups.insertNew(userID, name, clientIDs)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/groups/current");
  }).catch(error_500(res));
});

router.get("/edit/:groupID", function (req, res) {
  Groups.findByID(Number(req.params.groupID))
  .then((group) => {
    if (group) {
      Clients.findByUser(Number(req.params.userID), true)
      .then((clients) => {
        res.render("v4/primaryUser/groups/edit", {
          group: group,
          clients: clients
        });
      }).catch(error_500(res));
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});

router.post("/edit/:groupID", function (req, res) {
  const userID = req.user.cmid;
  const groupID = req.params.groupID;
  const name = req.body.name;

  // Clean clientIDs
  var clientIDs = req.body.clientIDs;
  if (!clientIDs) clientIDs = [];
  if (typeof clientIDs == "string") clientIDs = isNaN(Number(clientIDs)) ? [] : Number(clientIDs);
  if (typeof clientIDs == "number") clientIDs = [clientIDs];
  if (Array.isArray(clientIDs)) {
    clientIDs
    .map(function (ID) { return Number(ID); })
    .filter(function (ID) { return !(isNaN(ID)); });
    Groups.editOne(userID, groupID, name, clientIDs)
    .then(() => {
      res.redirect( "/v4/users/" + 
                    req.user.cmid + 
                    "/primary/groups/current");
    }).catch(error_500(res));
  } else {
    res.redirect("/404");
  }
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


