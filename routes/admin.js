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

      // raw query: SELECT COUNT(*) FROM msgs INNER JOIN convos ON (convos.convid=msgs.convo) WHERE convos.convid IN (1, 3) GROUP BY convo;

      db("convos").where("cm", cmid).pluck("convid")
      .then(function (convos) {

      	console.log("Got convos", convos)

	      db("msgs")
	      .count("msgid")
	      .select("convo")
	      .innerJoin("convos", "convos.convid", "msgs.convo")
	      .whereIn("convos.convid", convos)
	      .groupBy("convo")
	      .then(function (msgs) {
	      	res.send(msgs)

	        // var warning = req.flash("warning");
	        // var success = req.flash("success");

	        // res.render("clientstats", {
	        //   user: req.user,
	        //   cm: cm,
	        //   clients: clients,
	        //   warning: warning,
	        //   success: success
	        // });

	      }).catch(function (err) { console.log(err); res.redirect("/500"); });

      }).catch(function (err) { res.redirect("/500"); });

    } else { res.redirect("/401"); }

  }).catch(function (err) { res.redirect("/500"); });
})

module.exports = router;





