exports.allGroups = function (req, res) {
	req.database.query("SELECT id, name, description FROM core_group;", function (errorQuery, resultQuery) {
		if (errorQuery) {
			req.logger.warning(errorQuery);
			res.sendStatus(500);
		} else {
			req.engines['ejs'].renderFile('modules/admin/body/home.ejs', {
				'groups': resultQuery,
			}, (errorEjs, resultEjs) => {
				if (errorEjs) {
					req.logger.error(errorEjs);
					res.sendStatus(500);
				} else {
					res.send(resultEjs);
				}
			});
		}
	});
};

exports.oneGroup = function (req, res) {
	req.database.query("SELECT name, description FROM core_group WHERE id = ?;", [req.params.id], (errorGroup, resultGroup) => {
		if (errorGroup) {
			req.logger.warning(errorGroup);
			res.sendStatus(500);
		} else if (resultGroup.length < 1) {
			res.sendStatus(404);
		} else {
			var data = {};
			data.id = req.params.id;
			data.name = resultGroup[0]['name'];
			data.description = resultGroup[0]['description'];
			data.members = [];

			req.database.query("SELECT u.id AS id, u.name AS name, firstname, nick, position FROM core_membership AS m JOIN core_group AS g ON g.id = m.id_group JOIN core_user AS u ON u.id = m.id_user WHERE g.id = ?;", [req.params.id], (errorUsers, resultUsers) => {
				if (errorUsers) {
					req.logger.warning(errorUsers);
					res.sendStatus(500);
				} else {
					for (let i in resultUsers) {
						data.members.push({
							'id': resultUsers[i]['id'],
							'name': resultUsers[i]['name'],
							'firstname': resultUsers[i]['firstname'],
							'nick': resultUsers[i]['nick'],
							'position': resultUsers[i]['position']
						});
					}
					req.engines['ejs'].renderFile('modules/admin/body/group.ejs', data, (errorEjs, resultEjs) => {
						if (errorEjs) {
							req.logger.error(errorEjs);
							res.sendStatus(500);
						} else {
							res.send(resultEjs);
						}
					});
				}
			});
		}
	});
};

exports.createGroup = function (req, res) {
	if (req.body.name.constructor == String && req.body.name.length > 0) {
		req.database.query("SELECT COUNT(*) AS c FROM core_group WHERE name = ?;", [req.body.name.toLowerCase()], function (errorExists, resultExists) {
			if (errorExists) {
				res.sendStatus(500);
			} else {
				if (resultExists[0].c > 0) {
					res.json({
						success: 0
					});
				} else {
					req.database.query("INSERT INTO core_group (name, description) VALUES (?, ?);", [req.body.name.toLowerCase(), req.body.description], (error, result) => {
						if (error) {
							res.sendStatus(500);
						} else {
							res.json({
								success: 1
							});
						}
					});
				}
			}
		});
	} else {
		res.json({
			success: -1
		});
	}
};

exports.deleteGroup = function (req, res) {
	req.database.query("DELETE FROM core_membership WHERE id_group = ?;", [req.body.id], (errorMembership, resultMembership) => {
		if (errorMembership) {
			res.sendStatus(500);
		} else {
			req.database.query("DELETE FROM core_group WHERE id = ?;", [req.body.id], (errorGroup, resultGroup) => {
				if (errorGroup) {
					res.sendStatus(500);
				} else {
					res.sendStatus(200);
				}
			});
		}
	});
};

exports.updateGroup = function (req, res) {
	req.database.query("UPDATE core_group SET description = ? WHERE id = ?;", [req.body.description, req.body.id], (error, result) => {
		if (error) {
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.searchUser = function (req, res) {
	req.services.user.search(req.query.s, (promises, results) => {
		Promise.all(promises).then(() => {
			res.send(JSON.stringify(results));
		})
	});
};

exports.addMember = function (req, res) {
	req.database.query("SELECT COUNT(*) AS c FROM core_group WHERE id = ?", [req.body.idGroup], (errorGroup, resultGroup) => {
		if (errorGroup) {
			req.logger.error(errorGroup);
			res.sendStatus(500);
		} else {
			if (resultGroup[0].c == 0) {
				res.json({
					success: -2
				});
			} else {
				req.database.query("SELECT COUNT(*) AS c FROM core_user WHERE id = ?", [req.body.idUser], (errorUser, resultUser) => {
					if (errorUser) {
						req.logger.error(errorUser);
						res.sendStatus(500);
					} else {
						if (resultUser[0].c == 0) {
							res.json({
								success: -1
							});
						} else {
							req.database.query("SELECT COUNT(*) AS c FROM core_membership WHERE id_group = ? AND id_user = ?;", [req.body.idGroup, req.body.idUser], (errorExists, resultExists) => {
								if (errorExists) {
									req.logger.error(errorExists);
									res.sendStatus(500);
								} else {
									if (resultExists[0].c > 0) {
										res.json({
											success: 0
										});
									} else {
										console.log("req.body.isVPCom: ");
										console.log(req.body.isVPCom);
										req.database.query("INSERT INTO core_membership (id_group, id_user, position, term, isVPCom) VALUES(?, ?, ?, ?, ?)", [req.body.idGroup, req.body.idUser, req.body.position.toLowerCase(), parseInt(req.body.term), req.body.isVPCom], (error, result) => {
											if (error) {
												req.logger.error(error);
												res.sendStatus(500);
											} else {
												res.json({
													success: 1
												});
											}
										});
									}
								}
							});
						}
					}
				});
			}
		}
	});
};

exports.removeMember = function (req, res) {
	req.database.query("DELETE FROM core_membership WHERE id_group = ? AND id_user = ?;", [req.body.idGroup, req.body.idUser], (error, result) => {
		if (error) {
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};
