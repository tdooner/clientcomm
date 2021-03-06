const credentials = require('../../credentials');
const ACCOUNT_SID = credentials.accountSid;
const AUTH_TOKEN = credentials.authToken;
const TWILIO_NUM = credentials.twilioNum;

const db = require('../db');

// Twilio tools
const twilio = require('twilio');
const twClient = require('twilio')(ACCOUNT_SID, AUTH_TOKEN);

// Email tools
const emNotify = require('./em-notify');
const notifyUserFailedSend = emNotify.notifyUserFailedSend;


module.exports = {

  checkSMSstatus() {
    db.select('*')
    .from('msgs')
    .leftJoin('comms', 'comms.commid', 'msgs.comm')
    .whereNot('msgs.status_cleared', true)
    .and.whereNotNull('tw_sid')
    .then((msgs) => {
      console.log(`Running status check for ${msgs.length} messages.`);

      // Iterate through list, checking to see if any have changes status
      for (let i = 0; i < msgs.length; i++) {
        const msg = msgs[i];
        if (msg.tw_sid) checkMsgAgainstTwilio(msg);
      }
    }).catch((err) => { console.log(err); });
  },

  checkMsgAgainstTwilio(msg) {
    // Hit up Twilio API for the
    twClient.sms.messages(msg.tw_sid)
    .get((err, sms) => {
      if (err) {
        console.log('Twilio error: ');
        console.log(err);
        console.log('-- \n');

      // Handling for messages sent from client to Twilio
      } else if (sms.direction == 'inbound') {
        // If no change occured over msg prior status
        if (msg.tw_status == sms.status) {
          // We can close out cleared messages
          if (sms.status == 'received') {
            db('msgs')
            .where('msgid', msg.msgid)
            .update({ status_cleared: true })
            .then((success) => {
              console.log(`Cleared msg ${msg.msgid}`);
            }).catch((err) => { console.log(err); });
          }

        // There was a change
        } else {
          // The message changed to a valud we accept as closed
          if (sms.status == 'received') {
            db('msgs')
            .where('msgid', msg.msgid)
            .update({ status_cleared: true })
            .then((success) => {
              console.log(`Cleared msg ${msg.msgid}`);
            }).catch((err) => { console.log(err); });
          }
        }

      // Handling for messages sent from case manager to Twilio
      } else {
        // If no change occured over msg prior status
        if (msg.tw_status == sms.status) {
          // We can close out cleared messages
          if (sms.status == 'sent' || sms.status == 'delivered' || sms.status == 'failed') {
            db('msgs')
            .where('msgid', msg.msgid)
            .update({ status_cleared: true })
            .then((success) => {
              console.log(`Cleared msg ${msg.msgid}`);
            }).catch((err) => { console.log(err); });

          // Check that message is not stuck in queue
          } else {
            const created = new Date(msg.created);
            const now = new Date();
            const hrDiff = Math.floor((now - created) / 36e5); // this is one hour difference

            // It has been queued for too long (over 1 hour)
            // Should report this to the case manager
            if (hrDiff > 1) {
              db('msgs')
              .where('msgid', msg.msgid)
              .update({ status_cleared: true })
              .then((success) => {
                console.log(`Cleared msg ${msg.msgid}, but it failed to send.`);

                // Send an email to the case manager
                db('cms')
                .join('convos', 'cms.cmid', 'convos.cm')
                .where('convos.convid', msg.convo)
                .then((cms) => {
                  // Can only send if we find a cm associated with that convo
                  // TO DO: Include information about the client in the email
                  if (cms.length > 0) {
                    const cm = cms[0];
                    notifyUserFailedSend(cm, msg);
                  }
                }).catch((err) => { console.log(err); });
              }).catch((err) => { console.log(err); });
            }
          }

        // There was a change
        } else {
          // Results indicate msg can also be closed
          if (sms.status == 'sent' || sms.status == 'failed') {
            db('msgs')
            .where('msgid', msg.msgid)
            .update({ tw_status: sms.status, status_cleared: true })
            .then((success) => {
              console.log(`Cleared msg ${msg.msgid}`);
            }).catch((err) => { console.log(err); });

          // Update status but do not close out
          } else {
            db('msgs')
            .where('msgid', msg.msgid)
            .update({ tw_status: sms.status })
            .then((success) => {
              console.log(`Cleared msg ${msg.msgid}`);
            }).catch((err) => { console.log(err); });
          }
        }
      }
    });
  },

};
