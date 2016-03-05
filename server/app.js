// credentials loading
var credentials = require("../credentials");
var SESS_SECRET = credentials.sessionSecret;

// app initialization
var express = require("express");
var app = express();
var db  = require("./db");

// dependencies
var twilio = require("twilio");
var bodyParser = require('body-parser');
var session = require("express-session");
var cookieParser = require("cookie-parser");
var Promise = require("bluebird");
var http = require("http");
var fs = require("fs");

// configurations
app.set("view engine", "ejs");
app.use("/static", express.static("public"));
app.use(cookieParser());

// passport sessions and user management
var bcrypt = require("bcrypt-nodejs");
var passport = require("passport");
require("./passport")(passport);

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(session({
	secret: SESS_SECRET,
	resave: true,
	saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());

// establish database connection
var db = require("./db");

// utilities
var utils = {
	isLoggedIn: function (req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		else { res.redirect("/login"); }
	},
	hashPw: function (pw) { 
		return bcrypt.hashSync(pw, bcrypt.genSaltSync(8), null); 
	},
	validPw: function (pw1, pw2) { 
		return bcrypt.compareSync(pw1, pw2); 
	},
	twilio: twilio,
	Promise: Promise,
	http: http,
	fs: fs,
	accountSid: credentials.accountSid,
	authToken: credentials.authToken,
	twilioNum: credentials.twilioNum
}

// routes
require("../routes/access")(app, db, utils, passport);
require("../routes/cmview")(app, db, utils, passport);
require("../routes/sms")(app, db, utils, passport);

var port = 4000;
app.listen(port, function () { console.log("Listening on port", port); });




