
module.exports = function (app, db, utils, passport) {
  app.get("/500", function (req, res) {
  	res.status(500).send("Something happened.")
  })

  app.get("/404", function (req, res) {
  	res.status(404).send("404 Something happened.")
  })
};
