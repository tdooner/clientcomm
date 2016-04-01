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

				res.render("org", {
					user: req.user,
					org: org,
					cms: cms
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

      db("convos").where("cm", cmid).pluck("convid")
      .then(function (convos) {


      	// raw: SELECT COUNT(*), convo, date(msgs.created) FROM msgs INNER JOIN convos ON (convos.convid=msgs.convo) WHERE convos.convid IN (1, 3) GROUP BY convo, date(msgs.created);

	      // db("msgs")
	      // .count("msgid")
	      // .select("convo")
	      // .select("msgs.created")
	      // .innerJoin("convos", "convos.convid", "msgs.convo")
	      // .whereIn("convos.convid", convos)
	      // .groupBy("convo")
	      // .groupBy("msgs.created")
	      // .orderBy("msgs.created", "desc")
	      db.raw("SELECT COUNT(*), convo, date(msgs.created) FROM msgs INNER JOIN convos ON (convos.convid=msgs.convo) WHERE convos.convid IN (1, 3) GROUP BY convo, date(msgs.created)")
	      .then(function (msgs) {

	      	console.log(msgs);
	      	// msgs = msgs.map(function (ea) {
	      	// 	ea.created = new Date(ea.created).toISOString().split("T")[0]
	      	// 	return ea;
	      	// });

	      	// var clean = {}
	      	// msgs.forEach(function (ea) {
	      	// 	if (!clean[ea.convo]) { 
	      	// 		clean[ea.convo] = {};
	      	// 		clean[ea.convo][ea.created] = 0;
	      	// 	}
	      	// 	clean[ea.convo][ea.created] += Number(ea.count);
	      	// });

	        res.render("clientstats", {
	          user: req.user,
	          cm: cm,
	          msgs: msgs,
	        });

	      }).catch(function (err) { console.log(err); res.redirect("/500"); });

      }).catch(function (err) { res.redirect("/500"); });

    } else { res.redirect("/401"); }

  }).catch(function (err) { res.redirect("/500"); });
})

module.exports = router;





