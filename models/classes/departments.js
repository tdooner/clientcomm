'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;




// Class
class Departments {

  static selectByOrgID (orgID, activeStatus) {
    if (typeof activeStatus == "undefined") activeStatus = true;
    return new Promise((fulfill, reject) => {
      db("departments")
        .where("organization", orgID)
        .andWhere("active", activeStatus)
        .orderBy("name", "asc")
      .then((departments) => {
        fulfill(departments)
      }).catch(reject);
    })
  }

  static createOne (orgID, name, phoneNumber, userID) {
    return new Promise((fulfill, reject) => {
      db("departments")
        .insert({
          organization: orgID,
          name: name,
          phone_number: phoneNumber,
          created_by: userID,
          active: true
        })
      .then(() => {
        fulfill()
      }).catch(reject);
    });
  }
  
}

module.exports = Departments;