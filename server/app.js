


// New Relic monitoring ONLY if not test environ
var TESTENV = process.env.TESTENV;
if (TESTENV && TESTENV == "true") {
  console.log("Testing env. No monitoring.");
} else { 
  console.log("Production env. New Relic running.");
  require("newrelic");
}


// SECRET STUFF
var credentials = require("../credentials");
var SESS_SECRET = credentials.sessionSecret;



// APP INITIATE
var express = require("express");
var app = express();
var db  = require("./db");



// APP DEPENDENCIES
var bodyParser = require('body-parser');
var cookieParser = require("cookie-parser");
var session = require("cookie-session");
var flash = require("connect-flash");
var colors = require("colors");

// CONFIGURATION 1
app.set("view engine", "ejs");
app.use("/static", express.static("public"));
app.use("/components", express.static("bower_components"));
app.use("/modules", express.static("node_modules"));
app.use(cookieParser());



// PASSPORT SESSIONS, USERS
var bcrypt = require("bcrypt-nodejs");
var passport = require("passport");
require("./passport")(passport);



// CONFIGURATION 2
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(flash());
app.use(session({
  keys: [SESS_SECRET],
  name: 'CC_session',
}));


app.use(passport.initialize());
app.use(passport.session());


// Logging

app.use((req, res, next) => {
  let start = new Date()
  res.on('finish', () => {
    let milliseconds = new Date().getTime() - start.getTime()
    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let timestamp = start.toUTCString()
    let method = req.method
    let path = req.originalUrl
    let statusCode = res.statusCode
    let contentLength = res.header()._headers['content-length'] || 0
    let userAgent = req.headers['user-agent']
    console.log(
      `${ip} -- [${timestamp}] `+
      `${method} ${path} ${statusCode} `.magenta +
      `${contentLength} ${milliseconds}ms `.cyan +
      `"${userAgent}"`
    )
  });
  return next();
});


// UTILITIES
var utils = require("../utils/utils.js");
var auth = utils["pass"];



// ALL ROUTES
// Always run before routes
require("../routes/request-defaults")(app);

// Login and session management
require("../routes/access")(app, passport);

// Case manager workflow
var cmview = require("../routes/cmview");
app.use("/cms", auth.isLoggedIn, cmview)

// CM-Subroutes here
// TO DO: Discuss if these should be rolled in under cmview itself
// Capture view
var captureRoutes = require("../routes/cm-subroutes/capture");
app.use("/capture", auth.isLoggedIn, captureRoutes);

// Twilio-facing routes
require("../routes/sms")(app);
require("../routes/voice")(app);

// Admin routes
var adminManagement = require("../routes/admin");
app.use("/admin", auth.isAdmin, adminManagement)

// Account management GUI routes
var accountManagement = require("../routes/accountmanagement");
app.use("/accounts", auth.isSuper, accountManagement)

// Superuser routes
var supermgmt = require("../routes/super");
app.use("/orgs", auth.isSuper, supermgmt)

// Catch-alls
require("../routes/catchall")(app);


// V4 Route Structure
app.get("/v4", function (req, res) {
  res.redirect("/v4/orgs/" + req.user.org);
});
var versionFourApp = require("../routes/versionFour/roleRouter");
// app.use("/v4/orgs/:orgID", auth.isLoggedIn, versionFourApp)
app.use("/v4/", auth.isLoggedIn, versionFourApp)

// Redundant catch all
app.get("/*", function (req, res) {
  res.redirect("/404");
});



// START UP CLIENTCOMM
var port = 4000;
var server = app.listen(port, function () { 
  console.log("Listening on port", port);

  // Run super user check (after migrations)
  // TO DO: This method is hacky, there should be a callback at migrations completion
  setTimeout(function () { require("../utils/superuser-check.js")(); }, 5000);
});




// EXPORT SERVER
module.exports = server;



// SCHEDULER
// TO DO: Make anything here a CRON job
//        Get rid of need for these arbitrary env vars
// Process environment indicator
var EMNOTIF = process.env.EMNOTIF;

// EMNOTIF means run email notifications, including regular check up on text messages
if (EMNOTIF && EMNOTIF == "true") {
  var dailyTimer = 1000 * 60 * 60 * 24;
  var fifteenMinTimer = 1000 * 60 * 15; 
  var thirtySecTimer = 1000 * 60 * 0.5; 

  // Set activities
  setInterval(function () { require("../utils/em-notify").runEmailUpdates(); }, dailyTimer); 
  setInterval(function () { require("../utils/sms-status-check").checkSMSstatus(); }, thirtySecTimer); 
  setInterval(function () { require("../utils/timed-notification").checkAndSendNotifications(); }, fifteenMinTimer); 
}

