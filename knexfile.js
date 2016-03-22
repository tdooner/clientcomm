// Update with your config settings.
var credentials = require("./credentials")["db"];
var USER = credentials.user;
var PASS = credentials.password;

module.exports = {

  "development": {
    client: "postgresql",
    connection: {
      user: "kuanbutts",
      database: "clientcomm"
    }
  },

  "production": {
    client: "postgresql",
    connection: {
      database: "clientcomm",
      user:     USER,
      password: PASS
    },
    pool: {
      min: 2,
      max: 10
    },
    migrations: {
      tableName: "knex_migrations"
    }
  }

};
