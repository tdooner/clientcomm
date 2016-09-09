'use strict';

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


// Error Handling
const notFound = require("../routes/errorHandling").notFound
const error500 = require("../routes/errorHandling").error500

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
    let timestamp = start.toUTCString();
    let method = req.method;
    let path = req.originalUrl;
    let statusCode = res.statusCode;
    let contentLength = res.header()._headers['content-length'] || 0;
    let userAgent = req.headers['user-agent'];
    console.log(
      `${ip} -- [${timestamp}] ` +
      `${method} ${path} ${statusCode} `.magenta +
      `${contentLength} ${milliseconds}ms `.cyan +
      `"${userAgent}"\n`
    );
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

// CM-Subroutes here
// TO DO: Discuss if these should be rolled in under cmview itself
// Capture view
var captureRoutes = require("../routes/cm-subroutes/capture");
app.use("/capture", auth.isLoggedIn, captureRoutes);

// Twilio-facing routes
require("../routes/sms")(app);
require("../routes/voice")(app);

const modelsImport   = require("../models/models");
const Alerts = modelsImport.Alerts;
const Organizations  = modelsImport.Organizations;
const Departments    = modelsImport.Departments;

// Reroute from standard drop endpoint
app.get("/", (req, res, next) => {
  if (!req.hasOwnProperty("user")) {
    res.redirect('/login');
  } else if (["owner", "supervisor", "support"].indexOf(req.user.class) > -1) {
    res.redirect(`/org`);
  } else if (["developer", "primary"].indexOf(req.user.class) > -1) {
    res.redirect(`/clients`);
  } else {
    // TODO: Who hits this? Seems like this would never hit
    notFound(res);
  }
});

app.use((req, res, next) => {
  res.locals.leftTab = (name, hub, level, showOptions) => {
    let capitalized = name.charAt(0).toUpperCase() + name.slice(1)

    let url = `/${name}`
    if (level == "org") {
      url = `/org${url}`
    }

    let options = ``
    if (showOptions) {
     options = `
        <div class="option ${hub.sel == 'active' ? 'selected' : ''}">
          <a href="${url}?status=active">Active</a>
        </div>
        <div class="option ${hub.sel == 'inactive' ? 'selected' : ''}">
          <a href="${url}?status=inactive">Inactive</a>
        </div>    
      `  
    }

    return `
      <div class="leftTab ${hub.tab == name ? 'open' : 'closed'}">
        <div class="title"><a href="${url}">${capitalized}</a></div>
        ${options}
      </div>
    `
  }   
  next();
})


app.use("/", require("../routes/user"))
app.use("/", require("../routes/org"))

// Redundant catch all
app.get("/*", function (req, res) {
  notFound(res);
});


module.exports = app;