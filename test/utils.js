


// DEPENDENCIES
var db = require("../server/db");
var assert = require("chai").assert;
var creds = require("../credentials");



module.exports = {
  superuserLogin: function (req, cb) {
    console.log("working");
    req.post("/login")
      .field("email", creds.db.user)
      .field("pass", creds.db.password)
      .expect(302, cb);
  }
}