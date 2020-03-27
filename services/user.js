/*jshint esversion:6*/

module.exports = (context) => {
	var user = {};

	user.exists = (login, callback) => {
		context.database.query('SELECT COUNT(*) AS c FROM core_user WHERE login = ?', [login], (error, result) => {
			if (error) {
				context.logger.error('Unable to check if login ' + login + ' is free');
				callback(false);
			} else {
				callback(result[0].c > 0);
			}
		});
	};

	// mode = 'login' or 'id'
	user.describe = (identifier, mode, callback) => {
		if (mode == 'login' || mode == 'id') {
			context.database.query('SELECT * FROM core_user WHERE ' + mode + ' = ?', [identifier], (error, result) => {
				if (error) {
					context.logger.error('Unable to get user identified by ' + mode + ' ' + identifier);
					callback(null);
				} else {
					callback(result[0]);
				}
			});
		} else {
			context.logger.error('Improper way of calling service user.describe');
			callback(null);
		}
	};

	user.groups = (identifier, mode, callback) => {
		if (mode == 'login' || mode == 'id') {
			context.database.query('SELECT GROUP_CONCAT(g.id) AS ids, GROUP_CONCAT(g.name) AS names, GROUP_CONCAT(m.position) AS positions, GROUP_CONCAT(m.term) AS terms FROM core_user AS u JOIN core_membership AS m ON u.id = m.id_user JOIN core_group AS g ON g.id = m.id_group GROUP BY u.' + mode + ' HAVING u.' + mode + ' = ? ', [identifier], (error, result) => {
				if (error) {
					context.logger.error('Unable to get user identified by ' + mode + ' ' + identifier);
					callback(null);
				} else {
					callback(result[0]);
				}
			});
		} else {
			context.logger.error('Improper way of calling service user.groups');
			callback(null);
		}
	};

	user.search = (s, callback) => {
		var results = {};
		var allPromises = [];

		// nick
		allPromises.push(new Promise((resolve, reject) => {
			var byNick = [];
			context.database.query('SELECT id, nick, firstname, name FROM core_user WHERE nick LIKE ?;', ['%' + s + '%'], (error, result) => {
				if (error) {
					reject();
				} else {
					var nickPromises = [];
					for (let i = 0; i < result.length; i++) {
						nickPromises.push(new Promise((resolveNick, rejectNick) => {
							byNick.push({
								id: result[i].id,
								nick: result[i].nick,
								firstname: result[i].firstname,
								name: result[i].name
							});
							resolveNick();
						}));
					}
					Promise.all(nickPromises).then(() => {
						results.byNick = byNick;
						resolve();
					});
				}
			});
		}));

		// name, firstname
		allPromises.push(new Promise((resolve, reject) => {
			var byName = [];
			context.database.query('SELECT id, nick, firstname, name FROM core_user WHERE firstname LIKE ? OR name LIKE ?;', ['%' + s + '%', '%' + s + '%'], (error, result) => {
				if (error) {
					reject();
				} else {
					var namePromises = [];
					for (let i = 0; i < result.length; i++) {
						namePromises.push(new Promise((resolveName, rejectName) => {
							byName.push({
								id: result[i].id,
								nick: result[i].nick,
								firstname: result[i].firstname,
								name: result[i].name
							});
							resolveName();
						}));
					}
					Promise.all(namePromises).then(() => {
						results.byName = byName;
						resolve();
					});
				}
			});
		}));

		// floor
		allPromises.push(new Promise((resolve, reject) => {
			var byFloor = [];
			context.database.query('SELECT id, nick, firstname, name FROM core_user WHERE floor LIKE ?;', ['%' + s + '%'], (error, result) => {
				if (error) {
					reject();
				} else {
					var floorPromises = [];
					for (let i = 0; i < result.length; i++) {
						floorPromises.push(new Promise((resolveFloor, rejectFloor) => {
							byFloor.push({
								id: result[i].id,
								nick: result[i].nick,
								firstname: result[i].firstname,
								name: result[i].name
							});
							resolveFloor();
						}));
					}
					Promise.all(floorPromises).then(() => {
						results.byFloor = byFloor;
						resolve();
					});
				}
			});
		}));

		//birthdate ?
		allPromises.push(new Promise((resolve, reject) => {
			var byBirth = [];
			context.database.query('SELECT id, nick, firstname, name FROM core_user WHERE birth LIKE ?;', ['%' + s + '%'], (error, result) => {
				if (error) {
					reject();
				} else {
					var birthPromises = [];
					for (let i = 0; i < result.length; i++) {
						birthPromises.push(new Promise((resolveBirth, rejectBirth) => {
							byBirth.push({
								id: result[i].id,
								nick: result[i].nick,
								firstname: result[i].firstname,
								name: result[i].name
							});
							resolveBirth();
						}));
					}
					Promise.all(birthPromises).then(() => {
						results.byBirth = byBirth;
						resolve();
					});
				}
			});
		}));

		callback(allPromises, results);
	};

	return user;
};