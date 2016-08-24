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
        .select("departments.*", 
                "phone_numbers.value", 
                "member_counts.members",
                "cms.first as created_by_first",
                "cms.middle as created_by_middle",
                "cms.last as created_by_last")
        .leftJoin(
          db("cms")
            .select(db.raw("COUNT(*) AS members"), "department")
            .groupBy("department")
            .as("member_counts"),
          "member_counts.department", "departments.department_id")
        .leftJoin("cms", "cms.cmid", "departments.created_by")
        .leftJoin("phone_numbers", "phone_numbers.phone_number_id", "departments.phone_number")
        .where("departments.organization", orgID)
        .andWhere("departments.active", activeStatus)
        .orderBy("departments.name", "asc")
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