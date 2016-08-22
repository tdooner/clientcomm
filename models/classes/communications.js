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
        const commConnsIDArray = commConns.map(function (commConn) { 
          return commConn.comm;
        });
        Communications.getUseCounts(clientID, commConnsIDArray)
        .then((counts) => {
          commConns.map(function (commConn) {
            commConn.useCount = 0;
            counts.forEach(function (count) {
              if (count.comm == commConn.comm) commConn.useCount = count.count;
            });
            return commConn;
          });
          fulfill(commConns);
        }).catch(reject);
      }).catch(reject);
    }); 
  }

  static getUseCounts (clientID, communicationIDArray) {
    return new Promise((fulfill, reject) => {
      db("msgs")
        .select(db.raw("count(msgid), comm"))
        .whereIn("comm", communicationIDArray)
        .groupBy("comm")
      .then((counts) => {
        fulfill(counts);
      }).catch(reject);
    }); 
  }

  static removeOne (commConnID) {
    return new Promise((fulfill, reject) => {
      db("commconns")
        .where("commconnid", commConnID)
        .update({ retired: db.fn.now() })
      .then(() => {
        fulfill();
      }).catch(reject);
    }); 
  }

}

module.exports = Communications