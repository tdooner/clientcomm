
exports.up = function (knex, Promise) {
  return Promise.all([

    // Create a new col for timezone
    knex.raw('ALTER TABLE msgs ADD COLUMN status_cleared BOOLEAN DEFAULT FALSE;'),

  ]);
};

exports.down = function (knex, Promise) {
  return Promise.all([

    // Remove the timezone column, you will lose that data
    knex.raw('ALTER TABLE msgs DROP COLUMN IF EXISTS status_cleared;'),

  ]);
};
