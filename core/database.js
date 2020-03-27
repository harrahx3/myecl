/* jshint esversion:6 */

/*
    A minimalistic interface to use the database
    Creates and initialises the databases described in config.json
*/

const mysql = require('mysql');

module.exports = (context) => {
	context.logger.title('Database tools');
	const pool = mysql.createPool(context.database);
	var database = {};

	// Need for arguments, cannot use () => ...
	database.query = function () {
		return pool.query.apply(pool, arguments);
	};

	// table = {'name', 'schema', 'init'}
	database.create = (table) => {
		return new Promise((resolveCreate, rejectCreate) => {
			// Building the query
			var keys = [];

			if (table.constructor != Object || !table.hasOwnProperty('name') || table.name.constructor != String ||
				!table.hasOwnProperty('schema') || table.schema.constructor != Object) {
				context.logger.error('Cannot create database : wrong configuration');
				rejectCreate();
			} else {
				for (let key in table.schema) {
					if (key.constructor == String && key.length &&
						table.schema[key].constructor == String && table.schema[key].length) {
						keys.push(key + ' ' + table.schema[key]);
					} else {
						context.logger.error('Cannot create database : wrong configuration');
						rejectCreate();
					}
				}
				if (!keys.length) {
					context.logger.error('Cannot create database : wrong configuration');
					rejectCreate();
				} else {
					database.query('CREATE TABLE IF NOT EXISTS ' + table.name + '(' + keys.join(', ') + ');', (errorCreate, resultCreate) => {
						if (errorCreate) {
							context.logger.error('Cannot create database ' + table.name);
							rejectCreate();
						} else {
							// Initialisation of the table
							var initPromises = [];
							if (table.init) {
								if ([String, Array].includes(table.init.constructor)) {
									if (table.init.constructor == String) {
										table.init = [table.init];
									}
									for (let j = 0; j < table.init; j++) {
										initPromises.push(new Promise((resolveInit, rejectInit) => {
											database.query(table.init[j], (errorQuery, resultQuery) => {
												if (errorQuery) {
													context.logger.error('Error while initialising ' + table.name);
													context.logger.error('Cannot execute command ' + table.init[j]);
													rejectInit();
												} else {
													resolvInit();
												}
											});
										}));

									}
								} else {
									context.logger.warn('Table ' + table.name + ' initialisation failed, ignored');
								}

							}
							Promise.all(initPromises).then(() => {
								resolveCreate();
							}).catch(() => {
								context.logger.error(table.name + ' initialisation failed');
							});
						}
					});
				}

			}


		});
	};
	context.database = database;

	// Initialisation
	var createPromises = [];
	if ([Object, Array].includes(context.tables.constructor)) {
		if (context.tables.constructor == Object) {
			context.tables = [context.tables];
		}
		for (let i = 0; i < context.tables.length; i++) {
			createPromises.push(context.database.create(context.tables[i]));
		}
		Promise.all(createPromises).then(() => {}).catch(() => {
			context.logger.error('Databases creation failed');
		});
	} else {
		context.logger.error('Database creation failed');
	}
	context.logger.done();

};