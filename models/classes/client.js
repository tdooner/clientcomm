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
                "color_tags.name as color_name")

        // Join with color tag table
        .leftJoin(
          db("color_tags")
            .where("active", true)
            .as("color_tags"),
          "color_tags.color_tag_id", "clients.color_tag")

        // Only where active T/F and case manager matches
        .where("clients.clid", clientID)
        .limit(1)

      .then(function (clients) {

        // Need to make sure there is a default color_tag color
        clients.map(function (client) {
          if (!client.color_tag) client.color_tag = "#898989";
          if (!client.color_tag) client.color_name = "None";
          return client;
        });

        fulfill(clients[0])
      }).catch(reject);
    })
  }

  static editOne (clientID, first, middle, last, dob, uniqueID1, uniqueID2) {
    return new Promise((fulfill, reject) => {
      db("clients")
        .update({
          first: first,
          middle: middle,
          last: last,
          dob: dob,
          so: uniqueID1,
          otn: uniqueID2
        })
        .where("clid", clientID)
      .then(() => {
        fulfill()
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
    });
  }

  static create (userID, first, middle, last, dob, otn, so) {
    return new Promise((fulfill, reject) => {;
      db("clients")
        .insert({
          cm:     userID,
          first:  first,
          middle: middle,
          last:   last,
          dob:    dob,
          otn:    otn,
          so:     so,
          active: true
        })
        .returning("clid")
      .then(function (clientIDs) {
        console.log("ok", clientIDs);
        fulfill(clientIDs[0]);
      }).catch(reject);
    });
  }
  
}

module.exports = Client