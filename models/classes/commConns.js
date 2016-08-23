'use strict';

// Libraries
const db        = require("../../server/db");
const Promise   = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;

const Communications = require("./communications");


// Class
class CommConns {
  
  static findByClientID (clientID) {
    return new Promise((fulfill, reject) => {
      CommConns.findByClientIDs([clientID])
      .then((commconns) => {
        fulfill(commconns);
      }).catch(reject);
    })
  }
  
  static findByClientIDs (clientIDs) {
    return new Promise((fulfill, reject) => {
      db("commconns")
        .leftJoin(
          db("comms")
            .select("comms.commid", "comms.type", "comms.value")
            .as("comms"),
          "comms.commid", "commconns.comm")
        .whereIn("client", clientIDs)
        .and.where("retired", null)
      .then((commconns) => {
        fulfill(commconns);
      }).catch(reject);
    })
  }

  static createOne (clientID, name, value) {
    return new Promise((fulfill, reject) => {

      Communications.findByValue
      .then((comm) => {
        // if a comm method already exists just create a reference 
        if (comm) {
          db("commconns")
            .insert({
              client: clientID,
              comm: comm.commid,
              name: name
            })
          .then((success) => {
            fulfill();
          }).catch(reject);
        } else {
          Communications.createOne
        }
      }).catch(reject);


    }); 
  }

}

module.exports = CommConns