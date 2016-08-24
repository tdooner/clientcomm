'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;

const DepartmentSupervisors = require("./departmentSupervisors");



// Class
class Departments {

  static selectByOrgID (orgID, activeStatus) {
    if (typeof activeStatus == "undefined") activeStatus = true;
    return new Promise((fulfill, reject) => {
      var departmentsAll;
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
        departmentsAll = departments;
        const departmentIDs = departments.map(function (department) {
          return department.department_id;
        });
        return DepartmentSupervisors.selectByDepartmentIDs(departmentIDs, true)
      }).then((supervisors) => {
        departmentsAll = departmentsAll.map(function (department) {
          department.supervisors = [];
          supervisors.forEach(function (supervisor) {
            if (supervisor.department == department.department_id) {
              department.supervisors.push(supervisor);
            }
          });
          return department;
        });
        fulfill(departmentsAll)
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