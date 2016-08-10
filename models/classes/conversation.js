'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


// TO DOS
// Check if arrays are indeed arrays and that they have length > 0


// Class
class Conversation {
  static closeAll(cmid, clid) {
    return new Promise((fulfill, reject) => {
      db("convos")
        .where("client", clid)
        .andWhere("cm", cmid)
        .andWhere("convos.open", true)
        .pluck("convid")
        .then(function (convos) {
          db("convos").whereIn("convid", convos)
            .update({
              open: false
            }).then(function (success) {
              fulfill(success)
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

module.exports = Conversation