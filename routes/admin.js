var express = require("express");
var router = express.Router();

var db  = require("../server/db");
var sms = require("../utils/utils.js")["sms"];
var pass = require("../utils/utils.js")["pass"];
var orgtools = require("../utils/utils.js")["orgs"];

router.get("/", function (req, res) {
	console.log("here");
	db("orgs").where("orgid", req.user.org).limit(1)
	.then(function (orgs) {
		var warning = req.flash("warning");
		var success = req.flash("success");

		res.render("orgs", {
			orgs: orgs,
			warning: warning,
			success: success
		});

	}).catch(function (err) { res.redirect("/500"); });
});

module.exports = router;
