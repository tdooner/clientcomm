'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

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


// Models
const Conversations = require("./conversations");


// Class
class Messages {

  static sendMultiple (userID, clientIDs, title, content) {
    return new Promise((fulfill, reject) => {
      clientIDs.forEach(function (clientID) {
        Messages.smartSend(userID, clientID, title, content)
        .then(() => {
          fulfill();
        }).catch(reject);
      });
    });
  }

  static smartSend (userID, clientID, title, content) {
    Messages.getLatestNumber(userID, clientID)
    .then((convo) => {
    }).catch(reject);
  }

  static getLatestNumber (userID, clientID) {
    Messages.getMostRecentConversation(userID, clientID)
    .then((convo) => {
    }).catch(reject);
  }

  static getClientCommunications {
    
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

  static startNewConversation (userID, clientID, title, content, commID) {
    return new Promise((fulfill, reject) => {
      var newConvoId;

      Conversations.closeAllForClient(clientID)
      .then(() => {
        return Conversations.create(cmid, clid, subject, true)
      }).then((convoId) => {
        newConvoId = convoId
        return Communication.findById(commid)
      }).then((communication) => {
        var contentArray = content.match(/.{1,1599}/g);
        var twilioOperations = {
          error: false,
          explanation: null
        };

        contentArray.forEach(function (contentPortion, contentIndex) {
          var lastPortion = contentIndex == (contentArray.length - 1);

          twClient.sendMessage({
            to: communication.value,
            from: TWILIO_NUM,
            body: contentPortion
          }, (err, msg) => {
            if (err) {
              reject(err)
            } else {
              Message.create({
                convo: newConvoId,
                comm: commid,
                content: contentPortion,
                inbound: false,
                read: true,
                tw_sid: msg.sid,
                tw_status: msg.status,
              })
              .then((messageId) => {

                // Run only if error during last portion
                if (lastPortion) {
                  if (twilioOperations.error) {
                    res.redirect("/500");
                  } else {
                    req.flash("success", "New conversation created.");
                    redirect_loc = redirect_loc + "/convos/" + newConvoId;
                    res.redirect(redirect_loc);                  
                  }
                }

              }).catch(errorRedirect);
            }
          })

        });

      }).catch(reject);
    });      
  }
}

module.exports = Messages