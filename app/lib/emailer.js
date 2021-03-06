const nodemailer = require('nodemailer');
const colors = require('colors');

// Secret stuff
const credentials = require('../../credentials');
const empw = credentials.em.password;

// Only send to junk email when in development environment
const CCENV = process.env.CCENV || 'development';

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport(`smtps://clientcomm%40codeforamerica.org:${empw}@smtp.gmail.com`);

module.exports = {

  activationAlert(email, password) {
    const text = `Hello and welcome to ClientComm. Your temporary password is: ${password
                }\n You can log on to your ClientComm account by going to www.clientcomm.org and, ` +
                'from the login screen, you can choose to reset your password.';

    const mailOptions = {
      from: '"ClientComm - CJS" <clientcomm@codeforamerica.org>',
      to: CCENV === 'development' ? 'clientcomm@codeforamerica.org' : email,
      subject: 'CientComm - Welcome to ClientComm!',
      text,
      html: text,
    };

    if (CCENV == 'production') {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.log(error);
      });
    } else {
      console.log(`\tActivation alert email would have been sent to ${email}.`);
    }
  },

};

