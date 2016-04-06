
exports.up = function(knex, Promise) {
	return Promise.all([
		// alter dob to datetime
		knex.raw("ALTER TABLE clients ALTER COLUMN dob TYPE TIMESTAMP WITH TIME ZONE USING to_timestamp(dob, 'YYYY-MM-DD HH24:MI:SS')"),
	])
};

exports.down = function(knex, Promise) {
	return Promise.all([
		knex.raw("ALTER TABLE clients ALTER COLUMN dob TYPE varchar(255)"),
	])
};
