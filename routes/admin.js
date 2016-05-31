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

		if (orgs.length > 0) {
			var org = orgs[0];

			db("cms").where("org", orgid).orderBy("last")
			.then(function (cms) {

      	var rawQuery = "SELECT COUNT(*), cm, date(msgs.created) FROM msgs INNER JOIN convos ON (convos.convid=msgs.convo) WHERE convos.cm IN (";
      	rawQuery += cms.map(function (ea) { return ea.cmid; }).join(", ");
      	rawQuery += ") GROUP BY cm, date(msgs.created) ORDER BY DATE DESC";

	      db.raw(rawQuery)
	      .then(function (msgs) {

	      	var m = {};
	      	var m2 = {};
	      	msgs.rows.forEach(function (ea) {
	      		if (!m[ea.cm]) { m[ea.cm] = {} }
	      		var d = new Date(ea.date);
	      		ea.date = [d.getFullYear(), d.getMonth()+1, d.getDate()].join("-");
	      		m[ea.cm][ea.date] = Number(ea.count);
	      	});
	      	for (var ea in m) {
	      		var keys = Object.keys(m[ea]).sort(function (a,b) { return new Date(a) - new Date(b); });
	      		m2[ea] = {
	      			dates: keys,
	      			vals: keys.map(function (k) { return m[ea][k]; })
	      		}
	      	};

					res.render("org", {
						org: org,
						cms: cms,
						msgs: m2
					});

	      }).catch(function (err) { res.redirect("/500"); });

				
			}).catch(function (err) { res.redirect("/500"); });

		} else { res.redirect("/404"); }

	}).catch(function (err) { res.redirect("/500"); });
});

router.post("/", function (req, res) {
	var redirect_loc = "/admin";

	var orgid = Number(req.body.orgid);
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
	} else if (Number(req.user.org) !== orgid) {
		req.flash("warning", "Mismatched organization id's on form submit.");
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

router.get("/cms", function (req, res) {
	res.redirect("/admin");
})

router.get("/cms/:cmid", function (req, res) {
	var cmid = req.params.cmid;

	db("cms").where("cmid", cmid).limit(1)
  .then(function (cms) {

    // if no results, this client does not exist
    if (cms.length == 0) {
      res.redirect("/404");

    } else if ((req.user.cmid !== cmid) && (req.user.org == cms[0].org)) {
      var cm = cms[0];
      db("convos").where("cm", cmid).pluck("convid")
      .then(function (convos) {

      	if (convos.length == 0) { convos = ["null"]; };

      	var rawQuery = "SELECT COUNT(*), convo, date(msgs.created) FROM msgs INNER JOIN convos ON (convos.convid=msgs.convo) WHERE convos.convid IN (";
      	rawQuery += convos.join(", ");
      	rawQuery += ") GROUP BY convo, date(msgs.created) ORDER BY DATE DESC";
      	if (convos[0] == "null") { rawQuery += " LIMIT 0"; };
	      db.raw(rawQuery)
	      .then(function (msgs) {console.log(rawQuery);console.log(msgs);

	      	if (convos[0] == "null") { msgs.rows = []; };

	        res.render("clientstats", {
	          cm: cm,
	          msgs: msgs.rows,
	        });

	      }).catch(function (err) { res.redirect("/500"); });

      }).catch(function (err) { res.redirect("/500"); });

    } else { res.redirect("/401"); }

  }).catch(function (err) { res.redirect("/500"); });
})

module.exports = router;





