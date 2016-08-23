

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Client        = modelsImport.Client;
const Clients       = modelsImport.Clients;
const ColorTags     = modelsImport.ColorTags;
const Convo         = modelsImport.Convo;
const Message       = modelsImport.Message;
const Messages      = modelsImport.Messages;
const Communication = modelsImport.Communication;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;



// ROUTES

router.get("/open", function (req, res) {
  const managerID = Number(req.params.userID);
  const active    = true;

  Clients.findByUser(managerID, active)
  .then((clients) => {
    res.render("v4/primaryUser/clients", {
      hub: {
        tab: "clients",
        sel: "open"
      },
      clients: clients
    });
  }).catch(error_500(res));
});


router.get("/closed", function (req, res) {
  const managerID = Number(req.params.userID);
  const active    = false;

  Clients.findByManager(managerID, active)
  .then((clients) => {
    res.render("v4/primaryUser/clients", {
      hub: {
        tab: "clients",
        sel: "closed"
      },
      clients: clients
    });
  }).catch(error_500(res));
});


router.get("/create", function (req, res) {
  res.render("v4/primaryUser/client/create")
});


router.post("/create", function (req, res) {
  const userID = req.user.cmid;
  const first = req.body.first;
  const middle = req.body.middle ? req.body.middle : "";
  const last = req.body.last;
  const dob = req.body.DOB;
  const so = req.body.uniqueID1 ? req.body.otn : null;
  const otn = req.body.uniqueID2 ? req.body.so : null;

  Client.create(userID, first, middle, last, dob, otn, so)
  .then((clientID) => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/open");
  }).catch(error_500(res));
});


router.get ("/address/:clientID", function (req, res) {
  const clientID = Number(req.params.clientID);
  Client.findByID(clientID)
  .then((client) => {
    if (client) {
      res.render("v4/primaryUser/client/address", {
        client: client,
        template: {},
      });
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});


router.post ("/address/:clientID", function (req, res) {
  const userID = req.user.cmid;
  const clientID = Number(req.params.clientID);
  const subject = req.body.subject;
  const content = req.body.content;
  const commID = req.body.commID;

  Messages.startNewConversation(userID, clientID, subject, content, commID)
  .then(() => {
    req.flash("success", "Message to client sent.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/client/" + 
                  clientID);
  }).catch(error_500(res));
  
});



// EXPORT ROUTER OBJECt
module.exports = router;


