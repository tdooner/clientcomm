var env = "production";

// Update environment to use testing tools when applicable
var TESTENV = process.env.TESTENV;
if (TESTENV && TESTENV == "true") {
  env = "development";
}

var config = require('../knexfile');
var knex = require("knex")(config[env]);

module.exports = knex;
knex.migrate.latest([config]); 