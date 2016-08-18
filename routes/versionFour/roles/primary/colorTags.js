

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


// Access utilities
var accessChecking  = require("../../utilities/accessChecking");
var confirmMatch    = accessChecking.confirmMatch;


// GENERAL CHECK
// Default pass-through check to make sure accounts are querying endpoints correctly
router.use(function (req, res, next) {
  const userID0 = Number(req.params.userID);
  const userID1 = Number(req.user.cmid);
  if (confirmMatch("number", [userID0, userID1])) {
    next();
  } else {
    res.redirect("/404");
  }
});


// ROUTES

// Primary hub view, loads in active clients by default
router.get("/", function (req, res) {
  ColorTags.selectAllByUser(req.user.cmid)
  .then((colorTags) => {
    res.render("v4/primaryUser/colormanager", {
      colorTags: colorTags,
    });
  }).catch(error_500(res));
});

router.post("/new", function (req, res) {
  ColorTags.addNewColorTag(req.user.cmid, req.body.color, req.body.name)
  .then(() => {
    req.flash("success", "New color tag created.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/colortags");
  }).catch(error_500(res));
});

router.get("/:colorTagID/remove", function (req, res) {
  ColorTags.removeColorTag(req.params.colorTagID)
  .then(() => {
    req.flash("success", "Color tag removed.");
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/colortags");
  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;


