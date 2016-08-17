'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


const CommConns = require("./commConns");


// Class
class Users {

  static findByOrg (orgID) {
    return new Promise((fulfill, reject) => {
      db("cms")
        .where("org", orgID)
        .andWhere("active", true)
        .orderBy("last", "asc")
      .then(function (users) {
        fulfill(users);
      }).catch(reject);
    })
  }

  static findByID (userID) {
    return new Promise((fulfill, reject) => {
      db("cms")
        .where("cmid", userID)
        .andWhere("active", true)
        .limit(1)
      .then(function (users) {
        fulfill(users[0]);
      }).catch(reject);
    })
  }
  
}

module.exports = Users