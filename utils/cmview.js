var db = require("../server/db");
var Promise = require("bluebird");

module.exports = {

	get_convo: function (cmid, clid, convid) {
    return new Promise (function (fulfill, reject) {
  		db("clients").where("clid", clid).limit(1)
  		.then(function (clients) {
        if (clients.length > 0) {
          var client = clients[0];  

          if (client.cm == cmid) {

            db("convos").where("convid", convid).limit(1)
            .then(function (convos) {

              if (convos.length > 0) {
                var convo = convos[0];  

                if (convo.cm == cmid) {

                  db.select("msgs.content", "msgs.inbound", "msgs.read", "msgs.tw_status", "msgs.created", "comms.type", "comms.value", "commconns.name")
                  .from("msgs")
                  .innerJoin("comms", "comms.commid", "msgs.comm")
                  .innerJoin("commconns", "commconns.comm", "msgs.comm")
                  .where("msgs.convo", convid)
                  .orderBy("msgs.created", "asc")
                  .then(function (msgs) {

                    db("comms")
                    .innerJoin("commconns", "comms.commid", "commconns.comm")
                    .where("commconns.client", clid)
                    .then(function (comms) {

                      fulfill({
                        cl: client,
                        convo: convo,
                        msgs: msgs,
                        comms: comms
                      });
                      
                    }).catch(function (err) {
                      reject("500");
                    })

                  }).catch(function (err) {
                    reject("500")
                  })

                } else {
                  // actually not allowed to view
                  reject("404");
                }

              } else {
                // actually not allowed to view
                reject("404");
              }
            });

          } else {
            reject("404");
          }

        } else {
          reject("404");
        }
	    }).catch(function (err) {
			  reject(err);
			});
		});
	},



}