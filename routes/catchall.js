
module.exports = function (app, db, utils, passport) {

  app.get("/404", function (req, res) {
  	res.status(404).send("404 Information or page not found.")
  });


  app.get("/401", function (req, res) {
  	req.flash("warning", "401 Unauthorized access.");
  	res.redirect("/login");
  });

  app.get("/500", function (req, res) {
  	res.status(500).send("Internal Error 500 Something happened.")
  })
};
