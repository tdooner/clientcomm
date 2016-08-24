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

  static findByOrg (orgID, activeStatus) {
    if (typeof activeStatus == "undefined") activeStatus = true;

    return new Promise((fulfill, reject) => {
      db("cms")
        .select("cms.*", "departments.name as department_name")
        .leftJoin("departments", "departments.department_id", "cms.department")
        .where("cms.org", orgID)
        .andWhere("cms.active", activeStatus)
        .orderBy("cms.last", "asc")
      .then((users) => {
        fulfill(users);
      }).catch(reject);
    })
  }

  static findByID (userID) {
    return new Promise((fulfill, reject) => {
      db("cms")
        .where("cmid", userID)
        .limit(1)
      .then((users) => {
        fulfill(users[0]);
      }).catch(reject);
    })
  }

  static changeActivityStatus (userID, activeStatus) {
    if (typeof activeStatus == "undefined") activeStatus = false;
    return new Promise((fulfill, reject) => {
      db("cms")
        .where("cmid", userID)
        .update({ active: activeStatus })
      .then(() => {
        fulfill();
      }).catch(reject);
    })
  }

  static updateOne (targetUserID, first, middle, last, email, department, position, className) {
    return new Promise((fulfill, reject) => {
      db("cms")
        .where("cmid", targetUserID)
        .update({
          first: first,
          middle: middle,
          last: last,
          email: email,
          department: department,
          position: position,
          class: className
        })
      .then(() => {
        fulfill();
      }).catch(reject);
    })
  }
  
}

module.exports = Users;