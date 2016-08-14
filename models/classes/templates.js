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
class Templates {
  static findByUser (userID) {
    return new Promise((fulfill, reject) => {
      db("templates")
        .leftJoin(
          db("template_use")
            .select(db.raw("COUNT(template_use_id) as times_used, used_by"))
            .groupBy("template_use.used_by")
            .as("template_use"),
          "templates.casemanager", "template_use.used_by")
        .where("casemanager", userID)
        .andWhere("active", true)
      .then((templates) => {
        console.log(templates)
        fulfill(templates)
      }).catch(reject);
    })
  }
}

module.exports = Templates