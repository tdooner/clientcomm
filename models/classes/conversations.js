'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


// Class
class Conversations {
  static closeAllForClient (clientID) {
    return new Promise((fulfill, reject) => {
      db("convos")
        .where("cm", cliendID)
        .andWhere("convos.open", true)
        .pluck("convid")
        .then(function (convos) {
          db("convos").whereIn("convid", convos)
            .update({ open: false })
            .then(function () {
              fulfill()
            })
            .catch(reject)
        })
        .catch(reject)
    })
  }

  static create(cmid, clid, subject, open) {
    if (!open) {
      open = true;
    }
    return new Promise((fulfill, reject) => {
      db("convos")
      .insert({
        cm: cmid,
        client: clid,
        subject: subject,
        open: open,
        accepted: true,
      }).returning("convid").then((convoIds) => {
        fulfill(convoIds[0])
      }).catch(reject)
    })
  }
}

module.exports = Conversations