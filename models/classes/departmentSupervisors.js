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
                "cms.cmid",
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

  static updateSupervisors (departmentID, supervisorIDArray) {
    supervisorIDArray = supervisorIDArray.map(function (supervisorID) {
      return Number(supervisorID);
    }).filter(function (supervisorID) {
      return !isNaN(supervisorID);
    });
    var activeSupervisors;
    return new Promise((fulfill, reject) => {
      db("department_supervisors")
        .whereIn("supervisor", supervisorIDArray)
        .andWhere("department", departmentID)
        .update({ active: true })
        .returning("supervisor")
      .then((updatedSupervisors) => {
        activeSupervisors = updatedSupervisors;
        return db("department_supervisors")
        .whereNotIn("supervisor", supervisorIDArray)
        .andWhere("department", departmentID)
        .update({ active: false })
      }).then(() => {
        const remainingSupervisors = supervisorIDArray.filter(function (ID) {
          return activeSupervisors.indexOf(ID) < 0;
        });
        return DepartmentSupervisors.createSupervisors(departmentID, remainingSupervisors)
      }).then(() => {
        fulfill()
      }).catch(reject);
    });
  }

  static createSupervisor (departmentID, supervisorID) {
    return new Promise((fulfill, reject) => {
      DepartmentSupervisors.createSupervisors(departmentID, [supervisorID])
      .then(() => {
        fulfill();
      }).catch(reject);
    });
  }

  static createSupervisors (departmentID, supervisorIDArray) {
    return new Promise((fulfill, reject) => {
      const supervisorArray = supervisorIDArray.map(function (supervisorID) {
        return {
          department: departmentID,
          supervisor: supervisorID,
          active: true
        }
      });
      db("department_supervisors")
        .insert(supervisorArray)
      .then(() => {
        fulfill();
      }).catch(reject);
    });
  }
  
}

module.exports = DepartmentSupervisors;
