'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Using other models
const modelsImport  = require("../models");
const CommConns = modelsImport.CommConns;

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


// TO DOS
// Check if arrays are indeed arrays and that they have length > 0


// Class
class Notifications {
  
  static findByUser (userID, sent) {
    if (typeof sent == "undefined") sent = false;

    return new Promise((fulfill, reject) => {
      db("notifications")
        .leftJoin(
          db("clients")
            .select(db.raw("first, middle, last, clid"))
            .as("clients"),
          "clients.clid", "notifications.client")
        .where("cm", userID)
        .andWhere("sent", sent)
        .andWhere("closed", false)
        .orderBy("send", "asc")
      .then((notifications) => {
        fulfill(notifications)
      }).catch(reject);
    })
  }

  static findByID (notificationID) {
    return new Promise((fulfill, reject) => {
      db("notifications")
        .where("notificationid", notificationID)
        .limit(1)
      .then((notifications) => {
        fulfill(notifications[0])
      }).catch(reject);
    })
  }

  static removeOne (notificationID) {
    return new Promise((fulfill, reject) => {
      db("notifications")
        .update({ closed: true })
        .where("notificationid", notificationID)
      .then(() => {
        fulfill()
      }).catch(reject);
    })
  }

  static editOne (notificationID, clientID, commID, send, subject, message) {
    return new Promise((fulfill, reject) => {
      db("notifications")
        .update({
          client: clientID,
          comm: commID,
          subject: subject,
          message: message,
          send: send
        })
        .where("notificationid", notificationID)
      .then(() => {
        fulfill()
      }).catch(reject);
    })
  }

  static create (userID, clientID, commID, subject, message, send) {
    return new Promise((fulfill, reject) => {
      db("notifications")
        .insert({
          cm: userID,
          client: clientID,
          comm: commID,
          subject: subject,
          message: message,
          send: send,
          repeat: false,
          frequency: null,
          sent: false,
          closed: false,
          repeat_terminus: null
        })
      .then(() => {
        fulfill()
      }).catch(reject);
    })
  }

}

module.exports = Notifications