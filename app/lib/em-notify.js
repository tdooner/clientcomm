const db = require('../../app/db');
const Promise = require('bluebird');
const nodemailer = require('nodemailer');

const credentials = require('../../credentials');
const empw = credentials.em.password;

// Create reusable transporter object using the default SMTP transport
const smtps = `smtps://clientcomm%40codeforamerica.org:${empw}@smtp.gmail.com`;
const transporter = nodemailer.createTransport(smtps);

// Include some models
const Users = require('../models/users');
const CaptureBoard = require('../models/capture');

module.exports = {

  // the purpose is to email case managers/users if they have unread messages
  // then we email them with an alert that they do
  runEmailUpdates() {
    return new Promise((fulfill, reject) => {
      // reference variables
      let userIds;
      let usersThatNeedToBeAlerted;

      // current date information
      const dayOfTheWeek = new Date().getDay();
      const hourOfTheDay = new Date().getHours();

      // Basically each user has an attribute "email_alert_frequency"
      // it is an integer set to a "number of hours" between which they would
      // like to get email alerts for unread messages.
      // We determine if it is "the right day" of the week by querying for those with an
      // alerts frequency integer that is less than the interval we come up with
      // in the below logic block.
      // TODO: Vastly improve.
      let interval = 25; // hours
      if ([1, 3, 5, ].indexOf(dayOfTheWeek) > -1) {
        interval = 50;
      } else if (dayOfTheWeek == 4) {
        interval = 175;
      }

      // TODO: Do not execute raw queries here, either move to a lib or user Model Classes
      // We jsut want to query for the users who qualify for this runs email update process
      db('cms')
        .where('email_alert_frequency', '<', interval)
        .andWhere('active', true)
      .then((resp) => {
        // We just want the userIds from the response
        userIds = resp.map(user => user.cmid);

                        // want a sum total and only of unreads
        const rawQuery = ' SELECT count(msgid), MAX(msgs.created) AS made, cms.cmid, cms.first, cms.last, cms.email ' +
                        ' FROM msgs ' +

                        // lefts joings allow us to a link a message to a conversation then to a user (from client to user)
                        ' LEFT JOIN (SELECT convos.convid, convos.cm FROM convos) AS convos ON (convos.convid = msgs.convo) ' +
                        ' LEFT JOIN (SELECT cms.cmid, cms.first, cms.last, cms.email FROM cms) AS cms ON (cms.cmid = convos.cm) ' +

                        // within this bracketed period of time (only of unreads)
                        ' WHERE msgs.read = FALSE AND msgs.created > CURRENT_TIMESTAMP - INTERVAL \'1 day\' ' +
                        ' AND msgs.created < CURRENT_TIMESTAMP ' +

                        // break them up by unique users
                        ' GROUP BY cms.cmid, cms.first, cms.last, cms.email ORDER BY made DESC; ';

        // executes the above query
        return db.raw(rawQuery);
      }).then((resp) => {
        // if you run a raw query, then you have to extract the rows
        // from the resp object hence resp.rows
        usersThatNeedToBeAlerted = resp.rows;

        // we are going to filter out any users that should not be updated on this run
        usersThatNeedToBeAlerted = usersThatNeedToBeAlerted.filter(user => userIds.indexOf(user.cmid) > -1);

        // iterate over the resulting users list, and create a message object for each, then
        // use the transporter library to send a message through the ClientComm Gmail account
        usersThatNeedToBeAlerted.forEach((msg, i) => {
          // the message copy that will be emailed
          const text = ` Hello, ${msg.first} ${msg.last}, this is Code for America. ` +
                      ` You are receiving this automated email because you have ${msg.count} message(s) waiting for you in ClientComm. ` +
                      ' To view this message go to ClientComm.org and login with your user name and password. ' +
                      ' If you are having issues accessing your account, send me an email at clientcomm@codeforamerica.org and we will be happy to assist you any time, day or night!';

          // this is the formatted object that the transporter library needs
          const mailOptions = {
            from: '"ClientComm - CJS" <clientcomm@codeforamerica.org>',
            to: msg.email,
            subject: 'Alert: New Unread ClientComm Messages!',
            text,
            html: text,
          };

          // Send mail with defined transport object
          if (credentials.CCENV !== 'testing') {
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.log(error);
              }
              // TODO: here we are iterating through the array of clients to update
              // we then use the below if we want to fulfill() and exit array
              // but we should actually use a Promise array, map over it
              // and catch any and all errors instead of the above if statement
              if (i == usersThatNeedToBeAlerted.length - 1) {
                // kicks us out of this function successfully
                fulfill();
              }
            });

          // if we are in testing we need to exit successfully as well
          } else if (i == usersThatNeedToBeAlerted.length - 1) {
            fulfill();
          }
        });

        // if list is of length zero, then fulfill would never be called and the process would never completed
        // hence the below, which is why we should use Promise map
        if (usersThatNeedToBeAlerted.length == 0) {
          fulfill();
        }
      }).catch(reject);
    });
  },

  // runSupportStaffUpdates: function () {
  //   return new Promise((fulfill, reject) => {
  //     Users.findOneByAttribute('class', 'support')
  //     .then((users) => {

  //       // make a list of organizations that are all of the users
  //       let uniqueOrgs = [];
  //       users.forEach((user) => {
  //         let isInList = uniqueOrgs.indexOf(user.org);
  //         if (!isInList) {
  //           uniqueOrgs.push(user.org);
  //         }
  //       });
  //     }).catch(reject);
  //   });
  // },

  notifyUserFailedSend(cm, msg) {
    const text = `  Hi, ${cm.first}. You are recieving this email because a message you wrote failed to send. ` +
                ' This was not your fault - it was likely an error with the SMS service provider. ' +

                ' \n <b> What was the message? </b> ' +
                ' The contents of the message are included below: \n ' +
                ` "${msg.content}"` +

                ' \n <b> More details: </b> ' +
                ` The message was sent at ${msg.created}. ` +
                ` It's last known status was: ${msg.tw_status

                } \n <b> What should I do? </b> ` +
                ' Please check the message and send it again, if needed. ' +
                ` \n Thanks much and apologies for the inconvenience, ${cm.email
                } Kuan and Code for America, Team Salt Lake County`;

    const html = `<p>${text.split('\n').join('</p><p>')}</p>`;

    const mailOptions = {
      from: '"ClientComm - CJS" <clientcomm@codeforamerica.org>',
      to: cm.email,
      subject: 'Alert: Error sending message from ClientComm!',
      text,
      html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log(error);
    });
  },

  sendPassResetEmail(cm, uid, cb) {
    const text = `  Hello, ${cm.first} ${cm.last}. You are recieving this email because your account (${cm.email}) has requested a password reset. ` +
                ' \n If this was not you, you don\'t need to do anything. If it was you and you did intend to reset your password, please go to the ' +
                ' following address by either clicking on or cutting and pasting the following address: ' +
                ` \n https://secure.clientcomm.org/login/reset/${String(uid)
                } \n The above link will expire within 24 hours. After that time, please request a new key to update your password. `;

    const html = `<p>${text.split('\n').join('</p><p>')}</p>`;

    const mailOptions = {
      from: '"ClientComm - CJS" <clientcomm@codeforamerica.org>',
      to: cm.email,
      subject: 'CientComm Password Reset Email',
      text,
      html,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.log(error);
      cb();
    });
  },
};

