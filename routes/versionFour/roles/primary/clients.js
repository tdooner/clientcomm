

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
  res.send(req.body)
});



// EXPORT ROUTER OBJECt
module.exports = router;


