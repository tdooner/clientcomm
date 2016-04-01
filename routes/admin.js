var express = require("express");
var router = express.Router();

var db  = require("../server/db");
var sms = require("../utils/utils.js")["sms"];
var pass = require("../utils/utils.js")["pass"];
var orgtools = require("../utils/utils.js")["orgs"];

router.get("/", function (req, res) {
	var orgid = req.user.org;

	db("orgs").where("orgid", orgid).limit(1)
	.then(function (orgs) {
		var warning = req.flash("warning");
		var success = req.flash("success");

		if (orgs.length > 0) {
			var org = orgs[0];

			db("cms").where("org", orgid).orderBy("last")
			.then(function (cms) {

				res.render("org", {
					user: req.user,
					org: org,
					cms: cms,
					warning: warning,
					success: success
				});
				
			}).catch(function (err) { res.redirect("/500"); });

		} else { res.redirect("/404"); }

	}).catch(function (err) { res.redirect("/500"); });

});

module.exports = router;
