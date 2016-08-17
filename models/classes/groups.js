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
class Groups {
  
  static findByUser (userID, active) {
    if (typeof active == "undefined") active = true;
    var groupsComplete;
    return new Promise((fulfill, reject) => {
      db("groups")
        .where("user", userID)
        .andWhere("active", active)
        .orderBy(
          db.raw("upper(left(name, 1)), (substring(name from 2) || '')::varchar"), 
          "asc")
      .then((groups) => {
        groupsComplete = groups;
        var groupIDs = groups.map(function (group) {
          return group.group_id;
        });

        return Groups.findMembers(groupIDs)
      }).then((members) => {
          groupsComplete.map(function (group) {
            group.members = [];
            members.forEach(function (member) {
              if (member.group == group.group_id) group.members.push(member);
            });
            return group;
          });
          fulfill(groupsComplete);
      }).catch(reject);
    });
  }
  
  static findMembers (groupIDs) {
    if (!Array.isArray(groupIDs)) groupIDs = [groupIDs];
    return new Promise((fulfill, reject) => {
      db("group_members")
        .leftJoin("clients", "clients.clid", "group_members.client")
        .whereIn("group", groupIDs)
        .andWhere("group_members.active", true)
        .andWhere("clients.active", true)
      .then((members) => {
        fulfill(members);
      }).catch(reject);
    });
  }

  static findByID (groupID) {
    return new Promise((fulfill, reject) => {
      db("groups")
        .where("group_id", groupID)
        .limit(1)
      .then((groups) => {
        fulfill(groups[0]);
      }).catch(reject);
    });
  }
  
  static removeOne (groupID) {
    return new Promise((fulfill, reject) => {
      db("groups")
        .update({ active: false })
        .where("group_id", groupID)
      .then(() => {
        fulfill();
      }).catch(reject);
    });
  }
  
  static activateOne (groupID) {
    return new Promise((fulfill, reject) => {
      db("groups")
        .update({ active: true })
        .where("group_id", groupID)
      .then(() => {
        fulfill();
      }).catch(reject);
    });
  }
  
  static editOne (groupID, name) {
    return new Promise((fulfill, reject) => {
      db("groups")
        .update({ name: name })
        .where("group_id", groupID)
      .then((groups) => {
        fulfill(groups);
      }).catch(reject);
    });
  }
  
  static insertNew (userID, name, clientIDs) {
    return new Promise((fulfill, reject) => {
      db("groups")
        .insert({
          name: name,
          user: userID,
          active: true
        })
        .returning("group_id")
      .then((groupIDs) => {
        var groupID = groupIDs[0];
        if (groupID) {
          var insertArray = clientIDs.map(function (clientID) {
            return {
              group: groupID,
              client: clientID,
              active: true
            }
          });
          db("group_members")
            .insert(insertArray)
          .then(() => {
            fulfill();
          }).catch(reject);
        } else {
          reject("Failed create a new group and return ID.")
        }
      }).catch(reject);
    });
  }

}

module.exports = Groups;