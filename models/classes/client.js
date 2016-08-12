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
class Client {

  static findByManager (managerID, active) {
    // Default to an assuming viewing active clients
    if (!active) active = true;

    return new Promise((fulfill, reject) => {
      db("clients")
        .select("clients.*", 
                "color_tags.color as color_tag", 
                "color_tags.name")

        // Join with color tag table
        .leftJoin("color_tags", "color_tags.client", "clients.clid")

        // Only where active T/F and case manager matches
        .where("clients.cm", managerID)
        .andWhere("clients.active", active)

      .then(function (clients) {

        // Need to make sure there is a default color_tag color
        clients.map(function (client) {
          if (!client.color_tag) client.color_tag = "#898989";
          return client;
        });

        // Get unread messages and add them to client list
        Client
        .getUnreadMessages(managerID)
        .then((unreads) => {console.log(unreads);
          
          clients.map(function (client) {
            unreads.forEach(function (unread) {
              if (!client.unread) client.unread = 0;
              if (unread.client == client.clid) client.unread = Number(unread.unread);
            });
            return client;
          });
          console.log(clients)
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

module.exports = Client