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

  static findByID (clientID) {
    return new Promise((fulfill, reject) => {
      db("clients")
        .select("clients.*", 
                "color_tags.color as color_tag", 
                "color_tags.name")

        // Join with color tag table
        .leftJoin("color_tags", "color_tags.color_tag_id", "clients.color_tag")

        // Only where active T/F and case manager matches
        .where("clients.clid", clientID)
        .limit(1)

      .then(function (clients) {

        // Need to make sure there is a default color_tag color
        clients.map(function (client) {
          if (!client.color_tag) client.color_tag = "#898989";
          return client;
        });

        fulfill(clients[0])
      }).catch(reject);
    })
  }

  static alterCase (clientID, active) {
    if (typeof active == "undefined") active = true;

    return new Promise((fulfill, reject) => {
      db("clients")
        .update({ active: active })
        .where("clid", clientID)
      .then(() => {
        fulfill()
      }).catch(reject);
    })
  }

  static udpateColorTag (clientID, colorTagID) {
    return new Promise((fulfill, reject) => {
      db("clients")
        .update({ color_tag: colorTagID })
        .where("clid", clientID)
      .then(() => {
        fulfill()
      }).catch(reject);
    })

  }
  
}

module.exports = Client