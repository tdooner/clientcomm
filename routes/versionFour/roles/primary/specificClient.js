

// (Sub) router
var express         = require("express");
var router          = express.Router({mergeParams: true});


// Models
const modelsImport  = require("../../../../models/models");
const Client        = modelsImport.Client;
const ColorTags       = modelsImport.ColorTags;


// Twilio library tools and secrets
var credentials     = require("../../../../credentials");
var ACCOUNT_SID     = credentials.accountSid;
var AUTH_TOKEN      = credentials.authToken;
var twilio          = require("twilio");
var twilioClient    = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);


// General error handling
var errorHandling   = require("../../utilities/errorHandling");
var error_500       = errorHandling.error_500;


// ROUTES

router.get("/", function (req, res) {
  res.send("Page not made yet.")
});


router.get("/closecase", function (req, res) {
  Client
  .alterCase(req.params.clientID, false)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/open");
  }).catch(error_500(res));
});


router.get("/opencase", function (req, res) {
  Client
  .alterCase(req.params.clientID, true)
  .then(() => {
    res.redirect( "/v4/users/" + 
                  req.user.cmid + 
                  "/primary/clients/open");
  }).catch(error_500(res));
});

router.get("/editcolortag", function (req, res) {
  ColorTags
  .selectAllByUser(req.user.cmid)
  .then((colorTags) => {
    console.log("colorTags.length", colorTags.length)
    if (colorTags.length > 0) {
      res.send("ok need to show all colors")
      // res.render("v4/primaryUser/clients", {
      //   colorTags: colorTags,
      // });
    } else {
      res.redirect( "/v4/users/" + 
                    req.user.cmid + 
                    "/primary/colortags");
    }

  }).catch(error_500(res));
});


// EXPORT ROUTER OBJECt
module.exports = router;


