// Update with your config settings.

require("dotenv").config()
/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */

module.exports = {
	client: 'mysql',
	connection: process.env.JAWSDB_URL
/*	connection: {
		host: '127.0.0.1',
		user: "root",
		password: "K1ngv1d@l",
		database: "beatstream_data",
		charset: 'utf8',
	},*/
};
