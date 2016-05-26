


// SECRET STUFF
var credentials = require("../credentials");
var SESS_SECRET = credentials.sessionSecret;



// APP INITIATE
var express = require("express");
var app = express();
var db  = require("./db");



// APP DEPENDENCIES
var bodyParser = require('body-parser');
var session = require("express-session");
var cookieParser = require("cookie-parser");
var flash = require("connect-flash");



// CONFIGURATION 1
app.set("view engine", "ejs");
app.use("/static", express.static("public"));
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
	secret: SESS_SECRET,
	resave: true,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());



// UTILITIES
var utilsTEMP = {
	accountSid: credentials.accountSid,
	authToken: credentials.authToken,
	twilioNum: credentials.twilioNum
}

var utils = require("../utils/utils.js");
var auth = utils["pass"];



// ALL ROUTES
// Always run before routes
require("../routes/request-defaults")(app);

require("../routes/access")(app, db, utilsTEMP, passport);
require("../routes/cmview")(app, passport);
require("../routes/sms")(app);
require("../routes/voice")(app);

// Admin routes
var adminmgmt = require("../routes/admin");
app.use("/admin", auth.isAdmin, adminmgmt)

// Superuser routes
var supermgmt = require("../routes/super");
app.use("/orgs", auth.isSuper, supermgmt)

// Catch-alls
require("../routes/catchall")(app);



// START UP CLIENTCOMM
var port = 4000;
app.listen(port, function () { 
	console.log("Listening on port", port);

	// Run super user check (after migrations)
	// TO DO: This method is hacky, there should be a callback at migrations completion
	setTimeout(function () { require("../utils/superuser-check.js")(); }, 5000);
});



// SCHEDULER
// TO DO: Make anything here a CRON job
var timeDelay = 1000 * 60 * 60 * 24; 
setInterval(function () { require("../utils/em-notify").runEmailUpdates(); }, timeDelay); 







