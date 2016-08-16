
exports.up = function(knex, Promise) {
  return Promise.all([

    knex.schema.createTable("groups", function(table) {
      table.increments("group_id").primary();;

      table.string("name");

      table.integer("user")
           .references("cmid")
           .inTable("cms");

      table.boolean("active").defaultTo(true);
      table.timestamp("created").defaultTo(knex.fn.now());
    }),

    knex.schema.createTable("group_members", function(table) {
      table.increments("group_member_id").primary();;

      table.integer("group")
           .references("group_id")
           .inTable("groups");

      table.integer("client")
           .references("clid")
           .inTable("clients");

      table.boolean("active").defaultTo(true);
      table.timestamp("created").defaultTo(knex.fn.now());
    })


  ])
};

exports.down = function(knex, Promise) {
  return Promise.all([

    knex.schema.dropTable("groups"),
    knex.schema.dropTable("group_members")

  ]);
};
