


// SECRET STUFF
var credentials = require("../../credentials");
var ACCOUNT_SID = credentials.accountSid;
var AUTH_TOKEN = credentials.authToken;
var TWILIO_NUM = credentials.twilioNum;

// DEPENDENCIES
// Router
var express = require("express");
var router = express.Router();

// DB via knex.js to run queries
var db  = require("../../server/db");

// Twilio tools
var twilio = require("twilio");
var twClient = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);

// UTILITIES
var utils = require("../../utils/utils.js");

// Models
const Convo = require("../../models/models").Convo
const Message = require("../../models/models").Message
const Communication = require("../../models/models").Communication

// Query tools
var sms = utils["sms"];
var cmview = utils["cmview"];

// Session status control
var auth = utils["pass"];

// Error handling
var errorHandlers = utils["errorHandlers"];
var fivehundred   = errorHandlers.fivehundred;



// LOGIN LANDING PAGE ROUTER
router.get("/", function (req, res) {
  
  res.send("OK");

});


// EXPORT ROUTER OBJECt
module.exports = router;


