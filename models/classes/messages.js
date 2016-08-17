'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


// Class
class Messages {
  static sendMultiple (clientIDs, title, content) {
    console.log("ok");
    return new Promise((fulfill, reject) => {
      console.log(clientIDs);
      fulfill()
    })
  }

  static send () {

  }
}

module.exports = Messages