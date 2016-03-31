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
var twilio = require("twilio");

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

app.use(flash());
app.use(session({
	secret: SESS_SECRET,
	resave: true,
	saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

// utilities
var utils = {
	accountSid: credentials.accountSid,
	authToken: credentials.authToken,
	twilioNum: credentials.twilioNum
}
var auth = require("../utils/utils.js")["pass"];

require("../utils/superuser-check.js")();

// routes
var supermgmt = require("../routes/super-mgmt");

require("../routes/access")(app, db, utils, passport);
require("../routes/cmview")(app, passport);
require("../routes/sms")(app);

// superuser management
app.use("/orgs", auth.isSuper, supermgmt)

// catch alls
require("../routes/catchall")(app);



var port = 4000;
app.listen(port, function () { console.log("Listening on port", port); });




