var db = require("../server/db");

var credentials = require("../credentials");
var ACCOUNT_SID = credentials.accountSid;
var AUTH_TOKEN = credentials.authToken;
var TWILIO_NUM = credentials.twilioNum;

var pass = require("../utils/utils.js")["pass"];
var isLoggedIn = pass.isLoggedIn;


module.exports = function (app, passport) {

	// view current clients for a case manager
  app.get("/cms", isLoggedIn, function (req, res) { 
    var cmid = req.user.cmid;
    var redirect_loc = "/cms/" + cmid;
    res.redirect(redirect_loc);
  });

  app.get("/cms/:cmid", isLoggedIn, function (req, res) { 
    var cmid = req.user.cmid;

    db("cms").where("cmid", cmid).limit(1)
    .then(function (cms) {
      if (cms.length == 0) {
        res.redirect("/404");
      } else {
        if (cms[0].active) {
          db("clients").where("cm", cmid)
          .then(function (clients) {

            var warning = req.flash("warning");
            var success = req.flash("success");

            res.render("clients", {
              cm: cms[0],
              clients: clients,
              warning: warning,
              success: success
            });

          }).catch(function (err) {
            res.redirect("/500");
          });
        } else {
          res.redirect("/404");
        }
      }
    }).catch(function (err) {
      res.redirect("/500");
    })
    
  });

  
  app.post("/cms/:cmid", isLoggedIn, function (req, res) { 
    var redirect_loc = "/cms";

    var cmid = req.body.cmid;
    var first = req.body.first;
    var middle = req.body.middle;
    var last = req.body.last;
    var dob = req.body.dob;
    var otn = req.body.otn;
    var so = req.body.so;

    if (!middle) middle = "";

    if (!cmid) {
      req.flash("warning", "Missing cmid.");
      res.redirect(redirect_loc);
    } else if (Number(req.user.cmid) !== Number(cmid)) {
      req.flash("warning", "This ID does not match with the logged-in user");
      res.redirect(redirect_loc);
    } else if (!first) {
      req.flash("warning", "Missing first name.");
      res.redirect(redirect_loc);
    } else if (!last) {
      req.flash("warning", "Missing last name.");
      res.redirect(redirect_loc);
    } else if (isNaN(Date.parse(dob))) {
      req.flash("warning", "Missing date of birth.");
      res.redirect(redirect_loc);
    } else if (!otn) {
      req.flash("warning", "Missing OTN.");
      res.redirect(redirect_loc);
    } else if (!so) {
      req.flash("warning", "Missing SO number.");
      res.redirect(redirect_loc);
    } else {
      db("clients")
      .insert({
        cm: cmid,
        first: first,
        middle: middle,
        last: last,
        dob: dob,
        otn: otn,
        so: so,
        active: true
      }).then(function (success) {
        req.flash("success", "Added a new client.");
        res.redirect(redirect_loc);
      }).catch(function (err) {
        res.redirect("/500")
      })
    }
    
  });

  app.get("/cms/:cmid/cls", isLoggedIn, function (req, res) { 
    res.redirect("/cms");
  });

  app.get("/cms/:cmid/cls/:clid", isLoggedIn, function (req, res) { 
    var clid = req.params.clid;
    var cmid = req.user.cmid;
    db("clients").where("clid", clid).limit(1)
    .then(function (cls) {
      var cl = cls[0];
      if (cl.cm == cmid && cmid == req.params.cmid) {

        db("convos")
        .where("convos.cm", cmid)
        .andWhere("convos.client", clid)
        .orderBy("convos.updated")
        .then(function (convos) {

          db("comms").innerJoin("commconns", "comms.commid", "commconns.comm")
          .where("commconns.client", cl.clid)
          .then(function (comms) {

            var warning = req.flash("warning");
            var success = req.flash("success");

            res.render("client", {
              cm: req.user,
              cl: cl,
              comms: comms,
              convos: convos,
              warning: warning,
              success: success
            });
            
          }).catch(function (err) {
            res.redirect("/500");
          })

        }).catch(function (err) {
          res.redirect("/500");
        })

      } else {
        res.redirect("/404");
      }
    }).catch(function (err) {
      res.redirect("/500");
    })
  });


  app.post("/cms/:cmid/cls/:clid/comm", isLoggedIn, function (req, res) { 
    var redirect_loc = "/cms/" + req.params.cmid + "/cls/" + req.params.clid;

    var clid = req.params.clid;
    var cmid = req.user.cmid;
    var type = req.body.type;
    var value = req.body.value;
    var description = req.body.description;

    console.log("type is: ", type);
    if (type == "cell" || type == "landline") {
      value = value.replace(/[^0-9.]/g, "");
      if (value.length == 10) {
        value = "1" + value;
      }
      console.log("value is: ", value);
    }
    console.log("value 2 is: ", value);

    if (Number(clid) !== Number(req.body.clid)) {
      req.flash("warning", "Client ID does not match.");
      res.redirect(redirect_loc);
    } else if (Number(cmid) !== Number(req.body.cmid)) {
      req.flash("warning", "Case Manager ID does not match user logged-in.");
      res.redirect(redirect_loc);
    } else if (!type) {
      req.flash("warning", "Missing the communication type.");
      res.redirect(redirect_loc);
    } else if (!value) {
      req.flash("warning", "Missing the communication value (e.g. the phone number).");
      res.redirect(redirect_loc);
    } else if (type == "cell" && value.length !== 11) {
      req.flash("warning", "Incorrect phone value.");
      res.redirect(redirect_loc);
    } else if (!description) {
      req.flash("warning", "Missing description value.");
      res.redirect(redirect_loc);
    } else {
      db("comms").insert({
        type: type,
        value: value,
        description: description
      }).returning("commid")
      .then(function (commids) {
        var commid = commids[0];

        db("commconns").insert({
          client: clid,
          comm: commid,
          name: description
        })
        .then(function (success) {
          req.flash("success", "Added a new communication method.");
          res.redirect(redirect_loc);

        }).catch(function (err) {
          res.redirect("/500");
        })

      }).catch(function (err) {
        res.redirect("/500");
      })
    }
  });


  app.post("/cm/:clid/comm", isLoggedIn, function (req, res) { 
  	var clid = req.params.clid;
  	var ahref = "<a href='/cm/" + clid + "'>Return to user.</a>";

  	var comm = {}
  	if (!req.body.hasOwnProperty("type")) {
  		res.send("Missing Type. " + ahref);
  	} else {
  		comm.type = req.body.type;
  	}

  	if (!req.body.hasOwnProperty("value")) {
  		res.send("Missing Value. " + ahref);
  	} else {
  		var v = req.body.value;
  		if (comm.type == "email" || comm.type == "cell") { 
  			v = v.replace(/[^0-9.]/g, "");
  			if (v.length == 10) {
  				v = "1" + v;
  			}
  			if (v.length == 11) {
  				comm.value = v;	
  			} else {
  				res.send("Bad phone entry. Make sure it includes the country code (e.g. 1-848-123-4567). " + ahref);
  			}
  		} else {
  			comm.value = v;
  		}
  	}

  	if (!req.body.hasOwnProperty("description")) {
  		res.send("Missing Description. " + ahref);
  	} else {
  		comm.description = req.body.description;
  	}

  	comm.client = clid;
  	db("comms").insert(comm).then(function (client) {
  		res.redirect("/cm/" + clid);
  	});
  });

  app.post("/cm/:clid/send", isLoggedIn, function (req, res) { 
  	var clid = req.params.clid;
  	var ahref = "<a href='/cm/" + clid + "'>Return to user.</a>";

  	if (req.body.hasOwnProperty("device")) {
  		req.body.device = JSON.parse(req.body.device);
  	} else {
  		req.body.device = {};
  	}

  	var comm = {}
  	if (!req.body.device.hasOwnProperty("commid")) {
  		res.send("Missing communication id. " + ahref);
  	} else {
  		comm.comm = req.body.device.commid;
  	}

  	if (!req.body.device.hasOwnProperty("value")) {
  		res.send("Missing communication value. " + ahref);
  	}

  	if (!req.body.hasOwnProperty("content")) {
  		res.send("Missing message body. " + ahref);
  	} else {
  		comm.content = req.body.content;
  	}

  	comm.client = clid;
  	comm.read = true;

		var client = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);
		client.messages.create({
	    body: comm.content,
	    to: req.body.device.value,
	    from: TWILIO_NUM
		}, function(err, message) {
			if (err) {
				res.send("There was an error. " + ahref + "<br>" + err);
			} else {
				comm.tw_sid = message.sid;
				comm.tw_status = message.status;
		  	db("msgs").insert(comm).then(function (client) {
		  		res.redirect("/cm/" + clid);
		  	});
			}
		});
  });



  app.get("/fail", function (req, res) { res.send("Bad entry.") });

};
