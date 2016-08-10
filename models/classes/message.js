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
class Message {
  static create(messageObject) {
    return new Promise((fulfill, reject) => {
      db("msgs")
      .insert(messageObject).returning("msgid")
      .then((messageIds) => {
        fulfill(messageIds[0])
      }).catch(reject)
    })
  }
}

module.exports = Message