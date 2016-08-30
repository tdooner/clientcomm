

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
const Templates     = modelsImport.Templates;
const Users         = modelsImport.Users;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;

var logging                 = require("../../utilities/logging");
var logClientActivity       = logging.logClientActivity;
var logConversationActivity = logging.logConversationActivity;


// ROUTES
router.get("/", function (req, res) {
  res.redirect( "/v4/users/" + 
                req.user.cmid + 
                "/supervisor/clients/open");
});


router.get("/open", function (req, res) {
  const managerID = Number(req.user.cmid);
  Clients.findByDepartment(req.user.department, true)
  .then((clients) => {
    res.render("v4/supervisorUser/clients/clients", {
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
  Clients.findByDepartment(req.user.department, false)
  .then((clients) => {
    res.render("v4/supervisorUser/clients/clients", {
      hub: {
        tab: "clients",
        sel: "closed"
      },
      clients: clients
    });
  }).catch(error_500(res));
});


router.get("/create", function (req, res) {
  Users.findByDepartment(req.user.department, true)
  .then((users) => {
    res.render("v4/supervisorUser/clients/create", {
      users: users
    })
  }).catch(error_500(res));
});


router.post("/create", function (req, res) {
  const userID = req.body.targetUserID;
  const first = req.body.first;
  const middle = req.body.middle ? req.body.middle : "";
  const last = req.body.last;
  const dob = req.body.DOB;
  const so = req.body.uniqueID1 ? req.body.otn : null;
  const otn = req.body.uniqueID2 ? req.body.so : null;

  Client.create(userID, first, middle, last, dob, otn, so)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/supervisor/clients");
  }).catch(error_500(res));
});


router.get("/address/:clientID", function (req, res) {
  const clientID = Number(req.params.clientID);
  Client.findByID(clientID)
  .then((client) => {
    if (client) {
      res.render("v4/supervisorUser/clients/address", {
        client: client,
        template: {},
      });
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});


router.get("/address/:clientID/selecttemplate", function (req, res) {
  Templates.findByUser(req.user.cmid)
  .then((templates) => {
    res.render("v4/supervisorUser/clients/selecttemplate", {
      templates: templates,
      parameters: req.params
    });
  }).catch(error_500(res));
});


router.get("/address/:clientID/selecttemplate/:templateID", function (req, res) {
  const templateID = Number(req.params.templateID);
  const userID = req.user.cmid;
  const clientID = Number(req.params.clientID);

  Client.findByID(clientID)
  .then((client) => {
    if (client) { 
      Templates.findByID(templateID)
      .then((template) => {
        if (template) {
          Templates.logUse(templateID, userID, clientID)
          .then(() => {
            req.params.subject = template.title;
            req.params.message = template.content;
            res.render("v4/supervisorUser/clients/address", {
              client: client,
              template: template,
            });
          }).catch(error_500(res));
        } else {
          res.redirect( "/v4/users/" + 
                        req.user.cmid + 
                        "/supervisor/clients/address/" + 
                        clientID);
        }
      }).catch(error_500(res));
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));
});


router.post("/address/:clientID", function (req, res) {
  var targetUserID;
  const clientID = Number(req.params.clientID);
  const subject = req.body.subject;
  const content = req.body.content;
  const commID = req.body.commID;

  Client.findByID(clientID)
  .then((client) => {
    if (client) {
      targetUserID = client.cm;
      Messages.startNewConversation(targetUserID, clientID, subject, content, commID)
      .then(() => {
        logClientActivity(clientID);
        req.flash("success", "Message to client sent.");
        res.redirect( "/v4/users/" + 
                      req.user.cmid + 
                      "/supervisor/clients");
      }).catch(error_500(res));
    } else {
      res.redirect("/404");
    }
  }).catch(error_500(res));  
});



// EXPORT ROUTER OBJECt
module.exports = router;


