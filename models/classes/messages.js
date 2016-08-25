'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");
const moment  = require("moment");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


// SECRET STUFF
var credentials = require("../../credentials");
var ACCOUNT_SID = credentials.accountSid;
var AUTH_TOKEN = credentials.authToken;
var TWILIO_NUM = credentials.twilioNum;

// Twilio tools
var twilio = require("twilio");
var twClient = require("twilio")(ACCOUNT_SID, AUTH_TOKEN);
// Only send to junk number when in test mode
var TESTENV = process.env.TESTENV;
if (TESTENV && TESTENV == "true") {
  TESTENV = true;
} else { 
  TESTENV = false;
}


// Models
const Conversations = require("./conversations");
const Communications = require("./communications");
const Client = require("./client");


// Class
class Messages {

  static findByClientID (userID, clientID) {
    return new Promise((fulfill, reject) => {
      Conversations.findByUser(userID)
      .then((conversations) => {
        conversations = conversations.map(function (conversation) {
          return conversation.convid;
        });
        return Messages.findByConversations(clientID, conversations)
      }).then((messages) => {
          fulfill(messages);
      }).catch(reject);
    });
  }

  static findByConversations (clientID, conversationIDs) {
    if (!Array.isArray(conversationIDs)) conversationIDs = [conversationIDs];
    
    return new Promise((fulfill, reject) => {

      db("msgs")
        .select("msgs.*", 
                "commconns.client",
                "commconns.name as commconn_name", 
                "commconns.value as comm_value",
                "commconns.type as comm_type")
        .leftJoin(
          db("commconns")
            .join("comms", "commconns.comm", "comms.commid")
            .as("commconns"),
          "commconns.commid", "msgs.comm")
        .whereIn("convo", conversationIDs)
        .andWhere("client", clientID)
        .orderBy("created", "asc")
      .then((messages) => {
        fulfill(messages)
      }).catch(reject);
    });
  }

  static countsByOrg (orgID, timeframe) {
    return new Promise((fulfill, reject) => {
      db("msgs")
        .select(db.raw("date_trunc('" + timeframe + "', created) AS Week , count(*) AS message_count"))
        .leftJoin(
          db("convos")
            .select("convos.convid", "cms.org")
            .leftJoin("cms", "cms.cmid", "convos.cm")
            .as("convos"),
          "convos.convid", "msgs.convo")
        .whereRaw("msgs.created > now() - INTERVAL '12 months'")
        .andWhere("convos.org", orgID)
        .groupBy(db.raw("1"))
        .orderBy(db.raw("1"))
      .then((counts) => {
        counts = counts.map(function (count) {
          count.week = moment(count.week).format("YYYY-MM-DD");
          return count;
        });
        fulfill(counts);
      }).catch(reject);
    });
  }

  static sendMultiple (userID, clientIDs, title, content) {
    return new Promise((fulfill, reject) => {
      clientIDs.forEach(function (clientID, i) {
        Messages.smartSend(userID, clientID, title, content)
        .then(() => {}).catch(function (err) {});
      });
      fulfill();
    });
  }

  static smartSend (userID, clientID, title, content) {
    return new Promise((fulfill, reject) => {
      Messages.getLatestNumber(userID, clientID)
      .then((commID) => {
        if (commID) {
          Messages.startNewConversation(userID, clientID, title, content, commID)
          .then(() => {
            fulfill();
          }).catch(reject);
        } else {
          // fail silently
          fulfill();
        }
      }).catch(reject);
    });
  }

  static getLatestNumber (userID, clientID) {
    return new Promise((fulfill, reject) => {
      Communications.getClientCommunications(clientID)
      .then((comms) => {
        if (comms.length == 1) {
          fulfill(comms[0].comm);
        } else {
          Conversations.getMostRecentConversation(userID, clientID)
          .then((conversation) => {
            if (conversation) {
              const conversationID = conversation.convid;
              Conversations.getconversationMessages(conversationID)
              .then((messages) => {
                const lastMessage = messages.pop();
                if (lastMessage) {
                  fulfill(lastMessage.comm);
                } else {
                  fulfill();
                }
              }).catch(reject);

            } else {
              fulfill();
            }
          }).catch(reject);
        }
      }).catch(reject);
    });
  }



  static startNewConversation (userID, clientID, subject, content, commID) {
    return new Promise((fulfill, reject) => {
      var newConvoId;

      Conversations.closeAllForClient(userID, clientID)
      .then(() => {
        return Conversations.create(userID, clientID, subject, true)
      }).then((convoID) => {
        newConvoId = convoID;
        return Communications.findById(commID)
      }).then((communication) => {
        Messages.sendOne(commID, content, newConvoId)
        .then(() => {
          fulfill();
        }).catch(reject);
      }).catch(reject);
    });      
  }

  static sendOne (commID, content, conversationID) {
    return new Promise((fulfill, reject) => {
      var contentArray = content.match(/.{1,1599}/g);

      Communications.findById(commID)
      .then((communication) => {
        contentArray.forEach(function (contentPortion, contentIndex) {
          twClient.sendMessage({
            to: TESTENV ? "+18589057365" : communication.value,
            from: TWILIO_NUM,
            body: content
          }, (err, msg) => {
            if (err) {
              reject(err)
            } else {
              const MessageSID = msg.sid;
              const MessageStatus = msg.status;
              Messages.create(conversationID, commID, contentPortion, MessageSID, MessageStatus)
              .then(() => {
                if (contentIndex == contentArray.length - 1) fulfill();
              }).catch(reject);
            }
          })
        });
      }).catch(reject);
    });
  }

  static create (conversationID, commID, content, MessageSID, MessageStatus) {
    return new Promise((fulfill, reject) => {
      db("msgs")
        .insert({
          convo: conversationID,
          comm: commID,
          content: content,
          inbound: false,
          read: true,
          tw_sid: MessageSID,
          tw_status: MessageStatus
        })
        .returning("msgid")
      .then((messageIDs) => {
        fulfill(messageIDs[0]);
      }).catch(reject)
    })
  }

}

module.exports = Messages