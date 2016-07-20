
exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema.createTable("templates", function(table) {
      table.increments("template_id").primary();

      table.integer("org")
           .references("orgid")
           .inTable("orgs");

      table.integer("cm")
           .references("cmid")
           .inTable("cms");

      table.integer("cl")
           .references("clid")
           .inTable("clients");

      table.text("content");
      
      table.timestamp("created").defaultTo(knex.fn.now());
    })


  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([

    knex.schema.dropTable("templates")

  ]);
};
