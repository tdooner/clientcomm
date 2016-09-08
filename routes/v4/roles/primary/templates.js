

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

// Create base URL for this page
router.use((req, res, next) => {
  res.locals.parameters = req.params;
  req.redirectUrlBase = `/v4/orgs/${req.params.orgID}/users/${req.params.userID}/primary`;
  next();
});

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
    req.flash("success", "Removed template.")
    res.redirect(`${res.redirectUrlBase}/templates`);
  }).catch(error_500(res));
});

router.get("/create", function (req, res) {
  res.render("v4/primaryUser/templates/create");
});

router.post("/create", function (req, res) {
  const orgID   = req.params.orgID;
  const userID  = req.params.userID;
  const title   = req.body.title;
  const content = req.body.content;
  Templates.insertNew(orgID, userID, title, content)
  .then(() => {
    req.flash("success", "Created new template.")
    res.redirect(`${res.redirectUrlBase}/templates`);
  }).catch(error_500(res));
});


router.get("/edit/:templateID", function (req, res) {
  Templates.findByID(req.params.templateID)
  .then((template) => {
    if (template) {
      res.render("v4/primaryUser/templates/edit", {
        template: template
      });
    } else {
      notFound(res)
    }
  }).catch(error_500(res));
});


router.post("/edit/:templateID", function (req, res) {
  const templateID = req.params.templateID;
  const title   = req.body.title;
  const content = req.body.content;
  Templates.editOne(templateID, title, content)
  .then(() => {
    req.flash("success", "Template edited.")
    res.redirect(`${res.redirectUrlBase}/templates`);
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;


