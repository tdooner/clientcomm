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
class Communications {

  static findById (commID) {
    return new Promise((fulfill, reject) => {
      db("comms")
        .where("commid", commID)
        .limit(1)
      .then(function (comms) {
        fulfill(comms[0])
      })
      .catch(reject);
    })
  }

  static getClientCommunications (clientID) {
    return new Promise((fulfill, reject) => {
      db("commconns")
        .select("commconns.*", "comms.type", "comms.value")
        .leftJoin("comms", "comms.commid", "commconns.comm")
        .whereNull("retired")
        .andWhere("commconns.client", clientID)
      .then((commConns) => {
        fulfill(commConns);
      }).catch(reject);
    }); 
  }
}

module.exports = Communications