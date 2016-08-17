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
      
    })
  }
  
}

module.exports = Users