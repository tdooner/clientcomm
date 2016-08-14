

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Templates     = modelsImport.Templates;


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;


// Access utilities
var accessChecking  = require("../../utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;


// GENERAL CHECK
router.get("/", function (req, res) {
  Templates.findByUser(Number(req.params.userID))
  .then((templates) => {
    res.render("v4/primaryUser/templates/templates", {
      hub: {
        tab: "templates",
        sel: null
      },
      templates: templates
    });
  }).catch(error_500(res));
});

router.get("/remove/:templateID", function (req, res) {
  Templates.removeOne(req.params.templateID)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/templates");
  }).catch(error_500(res));
});

router.get("/create", function (req, res) {
  res.render("v4/primaryUser/templates/createtemplate", {});
});

router.post("/create", function (req, res) {
  const orgID   = req.user.org;
  const userID  = req.user.cmid;
  const title   = req.body.title;
  const content = req.body.content;
  Templates.insertNew(orgID, userID, title, content)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/templates");
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;


