'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;




// Class
class PhoneNumbers {

  static createOne (orgID, phone_number) {
    
  }

  static fingByOrgID (orgID) {
    return new Promise((fulfill, reject) => {
      db("phone_numbers")
        .where("organization", orgID)
      .then((numbers) => {
        fulfill(numbers);
      }).catch(reject);
    });
  }
  
}

module.exports = PhoneNumbers;