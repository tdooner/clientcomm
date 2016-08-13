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
class Clients {

  static findByManager (managerID, active) {
    // Default to an assuming viewing active clients
    if (typeof active == "undefined") active = true;

    return new Promise((fulfill, reject) => {
      db("clients")
        .select("clients.*", 
                "color_tags.color as color_tag", 
                "color_tags.name")

        // Join with color tag table
        .leftJoin("color_tags", "color_tags.color_tag_id", "clients.color_tag")

        // Only where active T/F and case manager matches
        .where("clients.cm", managerID)
        .andWhere("clients.active", active)
        .orderBy("clients.last", "asc")

      .then(function (clients) {

        // Need to make sure there is a default color_tag color
        clients.map(function (client) {
          if (!client.color_tag) client.color_tag = "#898989";
          return client;
        });

        // Get unread messages and add them to client list
        Clients
        .getUnreadMessages(managerID)
        .then((unreads) => {
          
          clients.map(function (client) {
            client.unread = 0;
            unreads.forEach(function (unread) {
              if (unread.client == client.clid) client.unread = Number(unread.unread);
            });
            return client;
          });
          fulfill(clients)

        }).catch(reject);
      }).catch(reject);
    })
  }

  static getUnreadMessages (managerID) {
    return new Promise((fulfill, reject) => {
      db("msgs")
        .select(db.raw("count(msgs.read) as unread, client"))
        .leftJoin("convos", "convos.convid", "msgs.convo")
        .where("msgs.read", false)
        .andWhere("convos.cm", managerID)
        .groupBy("convos.client")
      .then(function (unreads) {
        fulfill(unreads)
      }).catch(reject);
    })
  }
  
}

module.exports = Clients