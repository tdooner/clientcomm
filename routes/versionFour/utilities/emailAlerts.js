var db = require("../../../server/db");
var nodemailer = require("nodemailer");

var credentials = require("../../../credentials");
var empw = credentials.em.password;

// Create reusable transporter object using the default SMTP transport
var smtps = "smtps://clientcomm%40codeforamerica.org:" + empw + "@smtp.gmail.com";
var transporter = nodemailer.createTransport(smtps);

// Only send to junk email when in test mode
var TESTENV = process.env.TESTENV;
if (TESTENV && TESTENV == "true") {
  TESTENV = true;
} else { 
  TESTENV = false;
}

module.exports = {

  alertOfAccountActivation: function (email, password) {

    var text =  "Hello and welcome to ClientComm. Your temporary password is: " + password +
                "\n You can log on to your ClientComm account by going to www.clientcomm.org and, " + 
                "from the login screen, you can choose to reset your password.";

    var mailOptions = {
      from: '"ClientComm - CJS" <clientcomm@codeforamerica.org>', 
      to: TESTENV ? "kuanbutts@gmail.com" : email, 
      subject: "CientComm - Welcome to ClientComm!", 
      text: text, 
      html: text 
    };

    transporter.sendMail(mailOptions, function (error, info){
      if (error) console.log(error);
    }); 

  }

}

