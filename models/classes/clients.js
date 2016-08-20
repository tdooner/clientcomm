'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


const CommConns = require("./commConns");


// Class
class Clients {

  static findByManager (managerID, active) {
    // findByManager deprecated, use findByUser
    console.log("Warning! Clients method findByManager() deprecated, use findByUser()");

    return new Promise((fulfill, reject) => {
      Clients
      .findByUser(managerID, active)
      .then((clients) => {
        fulfill(clients);
      }).catch(reject);
    });
  }

  static findAllByUser (managerID) {
    return new Promise((fulfill, reject) => {
      var clientsOpen;
      Clients.findByUser(managerID, true)
      .then((clients) => {
        clientsOpen = clients;
        return Clients.findByUser(managerID, false)
      }).then((clientsClosed) => {
        fulfill(clientsOpen.concat(clientsClosed));
      }).catch(reject);
    });
  }

  static findByUser (managerID, active) {
    // Default to an assuming viewing active clients
    if (typeof active == "undefined") active = true;

    return new Promise((fulfill, reject) => {
      var finalClientsObject;

      db("clients")
        .select("clients.*", 
                "color_tags.color as color_tag", 
                "color_tags.name as color_name")

        // Join with color tag table
        .leftJoin(
          db("color_tags")
            .where("active", true)
            .as("color_tags"),
          "color_tags.color_tag_id", "clients.color_tag")

        // Only where active T/F and case manager matches
        .where("clients.cm", managerID)
        .andWhere("clients.active", active)
        .orderBy(
          db.raw("upper(left(clients.last, 1)), (substring(clients.last from 2) || '')::varchar"), 
          "asc")
      .then(function (clients) {

        // Need to make sure there is a default color_tag color
        finalClientsObject = clients.map(function (client) {
          if (!client.color_tag) client.color_tag = "#898989";
          if (!client.color_tag) client.color_name = "None";
          return client;
        });

        // Get unread messages and add them to client list
        return Clients.getUnreadMessages(managerID)
      }).then((unreads) => {
        finalClientsObject = finalClientsObject.map(function (client) {
          client.unread = 0;
          unreads.forEach(function (unread) {
            if (unread.client == client.clid) client.unread = Number(unread.unread);
          });
          return client;
        });

        // Now get all clientIDs to get Comm. Connections
        var clientIDs = finalClientsObject.map(function (client) {
          return client.clid
        });

        return CommConns.findByClientIDs(clientIDs)
      }).then((commconns) => {
        // Add each communication method to relevant client
        finalClientsObject = finalClientsObject.map(function (client) {
          client.communications = [];
          commconns.forEach(function (commconn) {
            if (client.clid == commconn.client) {
             client.communications.push(commconn) 
            }
          });
          return client;
        });
        fulfill(finalClientsObject);
      }).catch(reject);
    });
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


