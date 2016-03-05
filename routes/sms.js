module.exports = function (app, db, utils, passport) {

  app.post("/sms", function (req, res) {
    var twiml = new utils.twilio.TwimlResponse();
    var from = req.body.From.replace(/\D+/g, "");
    var text = req.body.Body.toUpperCase().trim();
    
  });

};
