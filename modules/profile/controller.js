const fs = require('fs');
const bcrypt = require('bcrypt');

exports.load = function (req, res) {
	var id = req.params.id;
	var updated = false;
	if (id == -1) {
		id = req.user.id;
	} else if (id == -2) {
		id = req.user.id;
		updated = true;
	}
	req.database.query("SELECT id, login, name, firstname, nick, DATE_FORMAT(birth, '%d/%m/%Y') AS birth, promo, floor, email, picture, online, DATE_FORMAT(last_seen, '%d/%m/%Y') AS last_seen_date, DATE_FORMAT(last_seen, '%H:%i') AS last_seen_hour FROM core_user WHERE id = ?", [id], function (error, result) {
		if (error) {
			req.logger.warning(error);
			res.sendStatus(500);
		} else {
			if (result.length) {
				var data = new Object();
				data.found = true;
				data.updated = updated;
				data.editable = id == req.user.id;
				data.id = id;
				for (let entry in result[0]) {
					if (entry != 'password') {
						data[entry] = result[0][entry]
					}
				}

				data.assos = new Array();
				var promises = new Array();
				req.database.query("SELECT u.name AS name, u.description AS description, m.position AS position FROM core_membership AS m JOIN core_group AS u ON m.id_group = u.id WHERE m.id_user = ?", [id], function (err2, result2) {
					if (err2) {
						req.logger.warning(error);
						res.sendStatus(500);
					} else {
						if (result2.length) {
							for (let i in result2) {
								promises.push(new Promise(function (resolve) {
									data.assos.push({
										'name': result2[i]['name'],
										'description': result2[i]['description'],
										'position': result2[i]['position']
									});
									resolve();
								}));
							}
							Promise.all(promises).then(function () {
								req.engines['ejs'].renderFile('modules/profile/body/main.ejs', data, (err, result) => {
									if (err) {
										req.logger.error(err);
										res.sendStatus(500);
									} else {
										res.send(result);
									}
								});
							})
						}
					}
				});

			} else {
				var data = new Object();
				data.found = false;
				req.engines['ejs'].renderFile('modules/profile/body/main.ejs', data, function (err, result) {
					if (err) {
						req.logger.error(err);
						res.status(500).send('Server error');
					} else {
						res.send(result);
					}
				});
			}
		}
	})
};

exports.save = function (req, res) {
	req.database.query("UPDATE core_user SET name=?, firstname=?, nick=?, email=?, birth=nullif(?, ''), floor=?, promo=? WHERE id=?;", [req.body.name, req.body.firstname, req.body.nick, req.body.email, req.body.birth, req.body.floor, req.body.promo, req.user.id], function (error, result) {
		if (error) {
			req.logger.warning(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.savePassword = function (req, res) {
	const oldPassword = req.body.old;
	const newPassword = req.body.new;
	req.database.query("SELECT password FROM core_user WHERE id = ?", [req.user.id], function (err, result) {
		if (err) {
			req.logger.error(err);
			res.sendStatus(500);
		} else {
			if (result.length) {
				bcrypt.compare(oldPassword, result[0]['password'], function (err2, valid) {
					if (err2) {
						res.send({
							'return': 'invalid'
						});
					} else if (!valid) {
						res.send({
							'return': 'mismatch'
						})
					} else {
						bcrypt.hash(newPassword, 10, function (err3, hash) {
							if (err3) {
								res.send({
									'return': 'unable'
								})
							} else {
								req.database.query("UPDATE core_user SET password = ? WHERE id = ?", [hash, req.user.id], function (err4, result2) {
									if (err4) {
										req.logger.error(err4);
										res.sendStatus(500);
									} else {
										res.sendStatus(200)
									}
								});
							}
						});
					}
				});
			} else {
				res.sendStatus(500);
			}
		}
	})
}

exports.deleteImage = function (req, res) {
	req.database.query("SELECT picture FROM core_user WHERE id = ?", [req.user.id], function (error, result) {
		if (error) {
			req.logger.warning(error);
			res.sendStatus(500);
		} else {
			if (result.length) {
				var filename = result[0]['picture'];
				if (filename != '0') {
					// suppresssion de l'ancienne image
					fs.unlink(req.user_upload + '/' + filename, function (error) {
						if (error) {
							req.logger.error(err);
							res.sendStatus(500);
						}
					});
				}
				req.database.query("UPDATE core_user SET picture = ? WHERE id = ?", ['0', req.user.id], function (err, result) {
					if (err) {
						req.logger.error(err);
						res.sendStatus(500);
					} else {
						res.sendStatus(200);
					}
				});
			}
		}
	});
};

exports.updateImage = function (req, res) {
	const source = req.body.source.replace(/^data:image\/png;base64,/, "");
	const datetime = req.body.datetime;
	req.database.query("SELECT picture FROM core_user WHERE id = ?", [req.user.id], function (error, result) {
		if (error) {
			req.logger.warning(error);
			res.sendStatus(500);
		} else {
			if (result.length) {
				var filename = result[0]['picture'];
				if (filename != '0') {
					// suppresssion de l'ancienne image
					fs.unlink(req.user_upload + '/' + filename, function (error) {
						if (error) {
							req.logger.error(err);
							res.sendStatus(500);
						}
					});
				}
				// nouveau nom
				var filename = 'profilePicture_' + datetime.toString() + '_' + (new Date()).getTime().toString() + ".png";
				// enregistrement de l'image
				fs.writeFile(req.user_upload + '/' + filename, source, 'base64', function (err) {
					if (err) {
						req.logger.error(err);
						res.sendStatus(500);
					} else {
						// modification dans la base de données
						req.database.query("UPDATE core_user SET picture = ? WHERE id = ?", [filename, req.user.id], function (err, result) {
							if (err) {
								req.logger.error(err);
								res.sendStatus(500);
							} else {
								res.sendStatus(200);
							}
						});
					}
				});
			}
		}
	});
};

exports.search = function (req, res) {
	req.services.user.search(req.query.s, (promises, results) => {
		Promise.all(promises).then(() => {
			res.send(JSON.stringify(results));
		})
	});
};