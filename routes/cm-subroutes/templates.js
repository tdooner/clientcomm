


// DEPENDENCIES
// Router
var express = require("express");
var router = express.Router({mergeParams: true});

// DB via knex.js to run queries
var db  = require("../../server/db");

// UTILITIES
var utils = require("../../utils/utils.js");

// Datetime management
var moment = require("moment");
var moment_tz = require("moment-timezone");

// Error handling
var errorHandlers = utils["errorHandlers"];
var fivehundred   = errorHandlers.fivehundred;


// TEMPLATES BOARD OVERVIEW
router.get("/", function (req, res) {
  
  // Reroute
  var errorRedirect = fivehundred(res); 
  var redirectLoc = "/cms/" + req.params.cmid + "/templates";
  
  db("templates")
  .where("org", req.user.org)
  .orWhere("casemanager", req.user.cmid)
  .then(function (templates) {

    res.render("casemanagers/templates/templates", {
      templates: templates
    });

  }).catch(errorRedirect);
});


// SHOW CARD FOR CREATING A NEW TEMPLATE
router.get("/create", function (req, res) {
  
  var errorRedirect = fivehundred(res); 
  var cmid = Number(req.user.cmid);

  db("clients")
  .where("cm", cmid)
  .andWhere("active", true)
  .then(function (clients) {
    res.render("casemanagers/templates/template_create_card", {
      clients: clients
    });
  }).catch(errorRedirect);

});


// POST NEW TEMPLATE DATA INTO DB
router.post("/create", function (req, res) {
  
  var errorRedirect = fivehundred(res); 
  var redirectLoc = "/cms/" + req.params.cmid + "/templates";

  var orgid = Number(req.user.org);
  var cmid =  Number(req.user.cmid);

  var clid = Number(req.body.client);
  if (isNaN(clid)) {
    clid = null;
  }

  var content = req.body.content;

  // Make sure that there is enough content
  if (!content || content.length < 1) {
    req.flash("warning", "Template content is too short.");
    res.redirect(redirectLoc + "/create");

  // Only continue if content has length
  } else {

    var insertObj = {
      org: orgid,
      casemanager: cmid,
      client: clid,
      content: content
    };

    // Run insert of new template
    db("templates")
    .insert(insertObj)
    .then(function (success) {
      res.redirect(redirectLoc);
    }).catch(errorRedirect);

  }
});






// EXPORT ROUTER OBJECt
module.exports = router;



// UTILITY FUNCIONS














