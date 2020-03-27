/* jshint esversion:6 */

/*
    Sets routes involved in signing up
*/

const fs = require('fs');

module.exports = (context) => {
	var controller = {};

	controller.load = (req, res) => {
		// TODO passer par le cas
		res.sendFile('/signup/index.html', {
			root: context.publicPath
		});
	};

	controller.exists = (req, res) => {
		if (!(req.query && req.query.login)) {
			res.sendStatus(404);
		} else {
			context.services.user.exists(req.query.login, (exists) => {
				res.json({
					result: exists
				});
			});
		}
	};

	controller.create = (req, res) => {
		// if no data sent or missing data
		if (
			!req.body || !req.body.data ||
			!req.body.data.login ||
			!req.body.data.name ||
			!req.body.data.firstname ||
			!req.body.data.password ||
			!req.body.data.nick ||
			!req.body.data.promo ||
			!req.body.data.floor ||
			!req.body.data.picture ||
			!req.body.data.pictureSource
		) {
			res.sendStatus(404);
		} else {
			const reLogin = /^[a-zA-Z0-9]+$/;
			const reText = /^[a-zA-Z\u00C0-\u017F\s']+$/;
			const reFloorComparat = /^([tuvx]([0-6]([0][1-9]|[1][0-6])?)?)$/;
			const reFloorAdoma = /^([abcd]([1-4]([0-2][0-9])?)?)$/;

			var login = req.body.data.login;
			var name = req.body.data.name;
			var firstname = req.body.data.firstname;
			var password = req.body.data.password;
			var nick = req.body.data.nick;
			var promo = req.body.data.promo;
			var floor = req.body.data.floor;
			var picture = req.body.data.picture;
			var pictureSource = req.body.data.pictureSource;

			// if data corrupted
			if (
				!login.length || !reLogin.test(String(login).toLowerCase()) ||
				!name.length || !reText.test(String(name).toLowerCase()) ||
				!firstname.length || !reText.test(String(firstname).toLowerCase()) ||
				!password.length || !floor.length ||
				!nick.length || !reLogin.test(String(nick).toLowerCase()) ||
				isNaN(parseInt(promo)) || parseInt(promo) < 1857 || parseInt(promo) > (new Date()).getFullYear() ||
				(!reFloorComparat.test(String(floor).toLowerCase()) &&
					!reFloorAdoma.test(String(floor).toLowerCase()) &&
					String(floor).toLowerCase() != 'adoma' &&
					String(floor).toLowerCase() != 'autre') ||
				!(picture == '0' ||
					(picture == '1' &&
						pictureSource.slice(0, 21) == 'data:image/png;base64' &&
						pictureSource.length * 2 / 1024 / 1024 < 2))
			) {
				res.sendStatus(404);
			} else {
				if (floor.toLowerCase() == 'adoma') {
					floor = 'Adoma';
				} else if (floor.toLowerCase() == 'autre') {
					floor = 'Autre';
				}

				context.services.user.exists(login, (exists) => {
					if (exists) {
						res.sendStatus(404);
					} else {
						context.crypter.encrypt(password, (hash) => {
							if (hash) {
								if (picture == '0') {
									context.database.query('INSERT INTO core_user (login, password, name, firstname, nick, promo, floor, picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [login, hash, name, firstname, nick, promo, floor, '0'], (error, result) => {
										if (error) {
											context.logger.error('Impossible to add user account into database');
											res.sendStatus(500);
										}
									});
								} else {
									var source = pictureSource.replace(/^data:image\/png;base64,/, '');
									var filename = 'profilePicture_' + (new Date()).getTime().toString() + '.png';

									fs.writeFile(context.userUploadsPath + '/' + filename, source, 'base64', function (errorImage) {
										if (errorImage) {
											context.logger.error(errorImage);
											res.sendStatus(500);
										} else {
											context.database.query('INSERT INTO core_user (login, password, name, firstname, nick, promo, floor, picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?);', [login, hash, name, firstname, nick, promo, floor, filename], (error, result) => {
												if (error) {
													context.logger.error('Impossible to add user account into database');
													res.sendStatus(500);
												}
											});
										}
									});
								}

								context.database.query('INSERT INTO core_membership (id_user, id_group, position, term) SELECT u.id, 2, \'centralien\', u.promo FROM core_user AS u WHERE u.login=?;', [login], (error, result) => {
									if (error) {
										context.logger.error('Unable to add user to group ecl');
									}
									res.json({
										state: 'successful'
									});
								});
							} else {
								res.sendStatus(500);
							}
						});
					}
				});
			}
		}
	};

	return controller;
};