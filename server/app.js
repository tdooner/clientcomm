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
var utilsTEMP = {
	accountSid: credentials.accountSid,
	authToken: credentials.authToken,
	twilioNum: credentials.twilioNum
}

var utils = require("../utils/utils.js");
var auth = utils["pass"];


// ALWAYS RUN BEFORE ROUTES
require("../routes/request-defaults")(app);

// routes
require("../routes/access")(app, db, utilsTEMP, passport);
require("../routes/cmview")(app, passport);
require("../routes/sms")(app);
require("../routes/voice")(app);

// superuser management
var adminmgmt = require("../routes/admin");
app.use("/admin", auth.isAdmin, adminmgmt)

// superuser management
var supermgmt = require("../routes/super");
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







