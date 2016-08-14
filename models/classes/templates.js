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
            .select(db.raw("COUNT(*) as times_used, template"))
            .groupBy("template_use.template")
            .as("template_use"),
          "templates.template_id", "template_use.template")
        .where("casemanager", userID)
        .andWhere("active", true)
      .then((templates) => {
        
        templates.forEach(function (template) {
          if (!template.times_used) template.times_used = 0;
        });

        fulfill(templates)
      }).catch(reject);
    })
  }

  static removeOne (templateID) {
    return new Promise((fulfill, reject) => {
      db("templates")
        .update({ active: false })
        .where("template_id", templateID)
      .then(() => {
        fulfill()
      }).catch(reject);
    })
  }

}

module.exports = Templates