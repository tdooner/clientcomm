// credentials loading
var credentials = require("../credentials");
var SESS_SECRET = credentials.sessionSecret;

// app initialization
var express = require("express");
var app = express();
var db  = require("./db");

// dependencies
var bodyParser = require('body-parser');
var session = require("express-session");
var cookieParser = require("cookie-parser");
var flash = require("connect-flash");

// configurations
app.set("view engine", "ejs");
app.use("/static", express.static("public"));
app.use("/modules", express.static("node_modules"));
app.use(cookieParser());

// passport sessions and user management
var bcrypt = require("bcrypt-nodejs");
var passport = require("passport");
require("./passport")(passport);

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
var utils = {
	accountSid: credentials.accountSid,
	authToken: credentials.authToken,
	twilioNum: credentials.twilioNum
}
var auth = require("../utils/utils.js")["pass"];


// DATETIME VARIABLES FOR EJS
var moment = require('moment');
var moment_tz = require('moment-timezone');


// DEFAULT EJS VARIABLES
app.use(function (req, res, next){	
	// Flash messages
	res.locals.warning = req.flash("warning");
	res.locals.success = req.flash("success");

	// Inclusion of momentJS for datetime modifications
	res.locals.moment = moment;
	res.locals.moment_tz = moment_tz;

	// Include user if logged in
	if (req.user) res.locals.user = req.user;

	// Proceed with routing
	next();
});

// routes
var adminmgmt = require("../routes/admin");
var supermgmt = require("../routes/super");

require("../routes/access")(app, db, utils, passport);
require("../routes/cmview")(app, passport);
require("../routes/sms")(app);
require("../routes/voice")(app);

// superuser management
app.use("/admin", auth.isAdmin, adminmgmt)

// superuser management
app.use("/orgs", auth.isSuper, supermgmt)

// catch alls
require("../routes/catchall")(app);



var port = 4000;
app.listen(port, function () { 
	console.log("Listening on port", port);

	// hacky method of ensuring that migrations are performed before the super user check occurs
	setTimeout(function () { require("../utils/superuser-check.js")(); }, 5000);
});

// logic to check once a day re: emails
var timeDelay = 1000 * 60 * 60 * 24;
setInterval(function () {
	require("../utils/em-notify").runEmailUpdates();
}, timeDelay); 







