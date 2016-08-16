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
class Groups {
  
  static findByUser (userID) {
    return new Promise((fulfill, reject) => {
      db("groups")
        .where("created_by", userID)
        .andWhere("active", true)
        .orderBy("name", asc)
      .then((groups) => {
        fulfill(groups);
      }).catch(reject);
    });
  }
  

}

module.exports = Groups;