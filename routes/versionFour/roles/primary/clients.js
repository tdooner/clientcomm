

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
    if (clientID) console.log(clientID);
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/open");
  }).catch(error_500(res));
});



// EXPORT ROUTER OBJECt
module.exports = router;


