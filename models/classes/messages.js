'use strict';

// Libraries
const db      = require("../../server/db");
const Promise = require("bluebird");

// Utilities
const utilities = require("../utilities")
const undefinedValuesCheck = utilities.undefinedValuesCheck;


// Class
class Messages {
  static sendMultiple (clientIDs, title, content) {
    return new Promise((fulfill, reject) => {
      clientIDs.forEach(function (clientID) {
        var commConn = null;
        Messages.startNewConversation(clientID, title, content, commConn)
        .then(() => {
          fulfill();
        }).catch(reject);
      });
    });
  }

  static startNewConversation (clientID, title, content, commConn) {


      var newConvoId;

      Convo.closeAll(cmid, clid)
      .then(() => {
        return Convo.create(cmid, clid, subject, true)
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
              res.send(err)

              if (err.hasOwnProperty("code") && err.code == 21211) {
                twilioOperations.error = true;
                twilioOperations.explanation = "That number is not a valid phone number.";
              } else {
                twilioOperations.error = true;
              }

              // Run only if error during last portion
              if (lastPortion) {
                if (twilioOperations.explanation) {
                  res.status(500).send(twilioOperations.explanation);
                } else {
                  res.redirect("/500");
                }
              }

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

  }
}

module.exports = Messages