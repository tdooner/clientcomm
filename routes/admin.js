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
	      		ea.date = [d.getFullYear()+1, d.getMonth(), d.getDate()].join("-");
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
						user: req.user,
						org: org,
						cms: cms,
						msgs: m2
					});

	      }).catch(function (err) { console.log(err); res.redirect("/500"); });

				
			}).catch(function (err) { res.redirect("/500"); });

		} else { res.redirect("/404"); }

	}).catch(function (err) { res.redirect("/500"); });
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
      	var rawQuery = "SELECT COUNT(*), convo, date(msgs.created) FROM msgs INNER JOIN convos ON (convos.convid=msgs.convo) WHERE convos.convid IN (";
      	rawQuery += convos.join(", ");
      	rawQuery += ") GROUP BY convo, date(msgs.created) ORDER BY DATE DESC"
	      db.raw(rawQuery)
	      .then(function (msgs) {

	        res.render("clientstats", {
	          user: req.user,
	          cm: cm,
	          msgs: msgs.rows,
	        });

	      }).catch(function (err) { res.redirect("/500"); });

      }).catch(function (err) { res.redirect("/500"); });

    } else { res.redirect("/401"); }

  }).catch(function (err) { res.redirect("/500"); });
})

module.exports = router;





