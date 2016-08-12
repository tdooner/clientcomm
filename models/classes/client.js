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
class Clients {

  static alterCase (clientID, active) {
    if (typeof active == "undefined") active = true;

    return new Promise((fulfill, reject) => {
      db("clients")
        .update({ active: active })
        .where("clid", clientID)
      .then(() => {
        fulfill()
      }).catch(reject);
    })
  }
  
}

module.exports = Clients