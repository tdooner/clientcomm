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
class Client {

  static findByManager (managerID, active) {
    // Default to an assuming viewing active clients
    if (!active) active = true;

    return new Promise((fulfill, reject) => {
      db("clients")
      .where("cm", managerID)
      .andWhere("active", active)
      .then(function (clients) {
        fulfill(clients);
      }).catch(reject);
    })
  }
  
}

module.exports = Client