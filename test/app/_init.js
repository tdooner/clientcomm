var config = require('../../knexfile');
var knex = require("knex")(config['testing']);

require("colors")

before(function(done) {
  knex.seed.run().then(() => done()).catch((err) => {
    done(err)
  })
})