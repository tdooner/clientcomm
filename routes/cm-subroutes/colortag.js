


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
  
  res.send("hi");

});



// EXPORT ROUTER OBJECt
module.exports = router;



// UTILITY FUNCIONS














