
exports.up = function(knex, Promise) {
	return Promise.all([

		knex.schema.createTable("cms", function(table) {
			table.increments("cmid").primary();

			table.string("first");
			table.string("middle").defaultTo("");
			table.string("last");

			table.string("email");
			table.string("pass");

			table.string("position");
			table.string("department");

			table.boolean("admin").defaultTo(false);
			table.boolean("active").defaultTo(true);
			
			table.timestamp("updated").defaultTo(knex.fn.now());
			table.timestamp("created").defaultTo(knex.fn.now());
		}),

		knex.schema.createTable("clients", function(table) {
			table.increments("clid").primary();

			table.integer("cm")
					 .references("cmid")
					 .inTable("cms");

			table.string("first");
			table.string("middle").defaultTo("");
			table.string("last");

			table.string("dob"); // YYYY-MM-DD format
			table.string("otn");
			table.string("so");

			table.boolean("active").defaultTo(true);
			
			table.timestamp("updated").defaultTo(knex.fn.now());
			table.timestamp("created").defaultTo(knex.fn.now());
		}),

		knex.schema.createTable("leads", function(table) {
			table.increments("lid").primary();

			table.integer("cm")
					 .references("cmid")
					 .inTable("cms");

			table.integer("comm")
					 .references("commid")
					 .inTable("comms");

			table.timestamp("created").defaultTo(knex.fn.now());
		}),

		knex.schema.createTable("msgs", function(table) {
			table.integer("client")
					 .references("clid")
					 .inTable("clients");

			table.integer("comm")
					 .references("commid")
					 .inTable("comms");
					 
			table.string("content");

			table.boolean("inbound").defaultTo(false);
			table.boolean("read").defaultTo(false);

			// twilio specific data
			table.string("tw_sid");
			table.string("tw_status");

			table.timestamp("created").defaultTo(knex.fn.now());
		}),

		knex.schema.createTable("comms", function (table) {
			table.increments("commid").primary();

			table.integer("client")
					 .references("clid")
					 .inTable("clients");

			table.string("type");        // e.g. email, cell, landline
			table.string("value");       // e.g. jim@email.com, 14542348723
			table.string("description"); // e.g. Joe's Obamaphone

			table.boolean("current").defaultTo(true);
			table.dateTime("terminated");
			table.timestamp("created").defaultTo(knex.fn.now());
		}),


	])
};

exports.down = function(knex, Promise) {
	return Promise.all([

		knex.schema.dropTable("cms"),
		knex.schema.dropTable("clients"),
		knex.schema.dropTable("msgs"),
		knex.schema.dropTable("comms"),
		knex.schema.dropTable("leads")

	])
};
