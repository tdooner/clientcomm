var env = "development";

var config = require('../knexfile');
var knex = require("knex")(config[env]);

module.exports = knex;
knex.migrate.latest([config]); 