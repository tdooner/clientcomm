module.exports = function (app) {

  app.post("/voice", function (req, res) {
    console.log("rece")
    res.send("<?xml version='1.0' encoding='UTF-8'?><Response><Say voice='woman'>Client Comm is a text only number currently. Please dial 385-468-3500 for the front desk and ask for your case manager.</Say></Response>")

    function handleError (err) {
      var now = new Date(Date.now()).toISOString().split("T");
      console.log("Error occurred on " + now[0] + " at " + now[1] + ": " + err);
      res.status(404).send(err);
      return false;
    };

  });

};
