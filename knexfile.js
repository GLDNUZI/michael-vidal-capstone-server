// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
	client: 'mysql',
	connection: {
		host: '127.0.0.1',
		user: "root",
		password: "K1ngv1d@l",
		database: "beatstream_data",
		charset: 'utf8',
	},
};
