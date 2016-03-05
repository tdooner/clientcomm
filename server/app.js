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

// configurations
app.set("view engine", "ejs");
app.use(express.static(__dirname + '/public'));
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

// routes
app.get("/", function (req, res) {
	// res.send("hello world");

	db("cms").where("email", "kuanbustts@yahoo.com").limit(1).then(function (row) {

		res.send(row.length)
	});

});

require("../routes/access")(app, db, passport);

var port = 4000;
app.listen(port, function () { console.log("Listening on port", port); });




