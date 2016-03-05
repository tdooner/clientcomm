module.exports = function (app, db, utils, passport) {

  app.get("/cmview", utils.isLoggedIn, function (req, res) { 
  	
  	res.send("OK");
  });


  app.get("/fail", function (req, res) { res.send("FAIL") });

};
