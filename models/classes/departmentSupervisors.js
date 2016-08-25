'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;




// Class
class DepartmentSupervisors {

  static findByDepartmentIDs (departmentIDArray, active) {
    if (typeof active == "undefined") active = true;
    return new Promise((fulfill, reject) => {
      db("department_supervisors")
        .select("department_supervisors.*", 
                "cms.first",
                "cms.middle",
                "cms.last")
        .leftJoin("cms", "cms.cmid", "department_supervisors.supervisor")
        .whereIn("department_supervisors.department", departmentIDArray)
        .andWhere("department_supervisors.active", active)
      .then((supervisors) => {
        fulfill(supervisors);
      }).catch(reject);
    });
  }
  
}

module.exports = DepartmentSupervisors;

