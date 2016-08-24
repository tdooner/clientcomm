'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;

// Models
const Messages = require("./messages");


// Class
class Organizations {
  
  static selectUsersByOrgID (orgID, activeStatus) {
    if (typeof activeStatus == "undefined") activeStatus = true;
    return new Promise((fulfill, reject) => {
      db("cms")
        .where("cms.org", orgID)
        .andWhere("active", activeStatus)
        .orderBy("last", "asc")
      .then((users) => {
        fulfill(users);
      }).catch(reject);
    });
  }

}

module.exports = Organizations;