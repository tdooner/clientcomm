var express = require("express");
var router = express.Router();

var db  = require("../server/db");
var sms = require("../utils/utils.js")["sms"];
var pass = require("../utils/utils.js")["pass"];

router.get("/", function (req, res) {
	db("orgs").orderBy("name")
	.then(function (orgs) {
		var warning = req.flash("warning");
		var success = req.flash("success");

		res.render("orgs", {
			orgs: orgs,
			warning: warning,
			success: success
		});
	}).catch(function (err) {
		res.redirect("/500");
	});
});

router.post("/", function (req, res) {
	var name = req.body.name;
	var from = sms.clean_phonenum(req.body.phone);
	var email = req.body.email;
	var expiration = req.body.expiration;
	var allotment = Number(req.body.allotment);

	if (typeof email == "string") { email = email.toLowerCase(); }

	if (!name) {
		req.flash("warning", "Missing name.");
		res.redirect("/orgs");
	} else if (!from) {
		req.flash("warning", "Missing phone number.");
		res.redirect("/orgs");
	} else if (!email) {
		req.flash("warning", "Missing email.");
		res.redirect("/orgs");
	} else if (isNaN(Date.parse(expiration))) {
		req.flash("warning", "Missing expiration date.");
		res.redirect("/orgs");
	} else if (isNaN(allotment)) {
		req.flash("warning", "Missing allotment.");
		res.redirect("/orgs");
	} else {
		db("orgs")
		.where("name", name)
		.orWhere("email", email)
		.then(function (response) {

			if (response.length == 0) {
				db("orgs").insert({
					name: name,
					email: email,
					expiration: expiration,
					allotment: allotment
				}).then(function (response) {
					req.flash("success", "Successful entry.");
					res.redirect("/orgs");
				}).catch(function (err) {
					req.flash("warning", "Failed to create new entry.");
					res.redirect("/orgs");
				});

			} else {
				req.flash("warning", "That name or email already exists.");
				res.redirect("/orgs");
			}

		}).catch(function (err) {
			req.flash("warning", "Error on searching for pre-existing organizations.");
			res.redirect("/orgs");
		});
	}
});

router.get("/:orgid", function (req, res) {
	var orgid = req.params.orgid;
	db("orgs").where("orgid", orgid).limit(1)
	.then(function (orgs) {
		var warning = req.flash("warning");
		var success = req.flash("success");

		if (orgs.length > 0) {
			var org = orgs[0];

			db("cms").where("org", orgid).orderBy("last")
			.then(function (cms) {

				res.render("org", {
					org: org,
					cms: cms,
					warning: warning,
					success: success
				});
				
			}).catch(function (err) {
				res.redirect("/500");
			});

		} else {
			res.redirect("/404");
		}

	}).catch(function (err) {
		res.redirect("/500");
	});
});

router.post("/:orgid", function (req, res) {
	var redirect_loc = "/orgs/" + req.params.orgid;

	var orgid = req.body.orgid;
	var first = req.body.first;
	var middle = req.body.middle;
	var last = req.body.last;
	var email = req.body.email;
	var password = req.body.password;
	var position = req.body.position;
	var department = req.body.department;
	var admin = req.body.admin;

	if (typeof email == "string") { email = email.toLowerCase(); }

	if (admin == "true") admin = true;
	if (admin !== true) admin = false;
	if (!middle) middle = null;

	if (!orgid) {
		req.flash("warning", "Missing orgid.");
		res.redirect(redirect_loc);
	} else if (!first) {
		req.flash("warning", "Missing first name.");
		res.redirect(redirect_loc);
	} else if (!last) {
		req.flash("warning", "Missing last name.");
		res.redirect(redirect_loc);
	} else if (!email) {
		req.flash("warning", "Missing email.");
		res.redirect(redirect_loc);
	} else if (!password) {
		req.flash("warning", "Missing password.");
		res.redirect(redirect_loc);
	} else if (!position) {
		req.flash("warning", "Missing position.");
		res.redirect(redirect_loc);
	} else if (!department) {
		req.flash("warning", "Missing department.");
		res.redirect(redirect_loc);
	} else {

		db("cms").where("email", email)
		.then(function (cms) {

			if (cms.length > 0) {
				req.flash("warning", "Email already in use.");
				res.redirect(redirect_loc);
			} else {
				db("cms").insert({
					org: orgid,
					first: first,
					middle: middle,
					last: last,
					email: email,
					pass: pass.hashPw(password),
					position: position,
					department: department,
					admin: admin,
					active: true,
					superuser: false,
				}).then(function (success) {
					req.flash("success", "Added new member.");
					res.redirect(redirect_loc);
				}).catch(function () {
					res.redirect("/500");
				});
			}

		}).catch(function () {
			res.redirect("/500");
		})

	}
});

// delete method workaround
router.post("/:orgid/cms/:cmid/delete", function (req, res) {
	var redirect_loc = "/orgs/" + req.params.orgid;
	var cmid = req.body.cmid;

	db("cms").where("cmid", cmid).update({active: false})
	.then(function (success) {
		req.flash("success", "Deactivated member.");
		res.redirect(redirect_loc);
	}).catch(function () {
		res.redirect("/500");
	});
});

module.exports = router;
