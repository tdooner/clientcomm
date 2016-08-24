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
  
}

module.exports = Departments;