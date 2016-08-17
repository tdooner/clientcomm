'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


// Class
class Conversations {
  
  static closeAllForClient (userID, clientID) {
    return new Promise((fulfill, reject) => {
      db("convos")
        .where("client", clientID)
        .andWhere("cm", userID)
        .andWhere("open", true)
        .update({ open: false })
      .then(function () {
        fulfill();
      }).catch(reject);
    })
  }

  static getMostRecentConversation (userID, clientID) {
    return new Promise((fulfill, reject) => {
      db("convos")
        .where("cm", userID)
        .andWhere("client", clientIDs)
        .orderBy("updated", "desc")
        .limit(1)
      .then((convos) => {
        fulfill(convos[0]);
      }).catch(reject);
    }); 
  }

  static getconversationMessages (conversationID) {
    db("msgs")
      .where("convo", conversationID)
      .orderBy("created", "asc")
    .then((messages) => {
      fulfill(messages);
    }).catch(reject);
  }

  static create(cmid, clid, subject, open) {
    if (!open) open = true;
    return new Promise((fulfill, reject) => {
      db("convos")
        .insert({
          cm: cmid,
          client: clid,
          subject: subject,
          open: open,
          accepted: true,
        })
        .returning("convid")
      .then((convoIDs) => {
        fulfill(convoIDs[0]);
      }).catch(reject)
    })
  }
}

module.exports = Conversations