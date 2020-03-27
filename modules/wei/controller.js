/*jshint esversion: 6 */

exports.createTeam = function (req, res) {
	var name = req.body.name;
	var number = req.body.number;
	req.database.query('INSERT INTO EquipeWei (name, number, score) VALUES (?, ?, 0);', [name, number], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.updateTeam = function (req, res) {
	var id = req.body.id;
	var name = req.body.name;
	var phrase = req.body.phrase;

	if (name != "" && phrase != "") {
		req.database.query("UPDATE EquipeWei SET name = ?, phrase = ? WHERE id = ?;", [name, phrase, id], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			}
		});
	} else if (name != "") {
		req.database.query("UPDATE EquipeWei SET name = ? WHERE id = ?;", [name, id], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			}
		});
	} else if (phrase != "") {
		req.database.query("UPDATE EquipeWei SET phrase = ? WHERE id = ?;", [phrase, id], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			}
		});
	} else {
		res.sendStatus(200);
	}
};

exports.getAll = function (req, res) {
	req.database.query('SELECT id, name, number, phrase, score, COUNT(*) AS members FROM EquipeWei AS e JOIN MembreEquipeWei AS me ON e.id = me.id_team GROUP BY id_team ORDER BY number;', (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var teams = [];
			for (let team in result) {
				teams.push({
					id: result[team].id,
					number: result[team].number,
					name: result[team].name,
					phrase: result[team].phrase,
					score: result[team].score,
					members: result[team].members
				});
			}
			res.json({
				teams: teams
			});
		}
	});
};

exports.getMembers = function (req, res) {
	const allMembers = (id) => {
		req.database.query('SELECT nick, firstname, name FROM core_user AS u JOIN MembreEquipeWei AS me ON u.id = me.id_member WHERE me.id_team = ?;', [id], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				var members = [];
				for (let key in result) {
					members.push({
						nick: result[key].nick,
						firstname: result[key].firstname,
						name: result[key].name
					});
				}
				res.json({
					members: members
				});
			}
		});
	};

	const getId = (id) => {
		if (id <= 0) {
			req.database.query("SELECT id_team FROM MembreEquipeWei WHERE id_member = ?;", [req.user.id], (error, result) => {
				if (error) {
					req.logger.error(error);
					res.sendStatus(500);
				} else {
					if (result.length > 0) {
						allMembers(result[0].id_team);
					}
				}
			});
		} else {
			allMembers(id);
		}
	};

	getId(req.query.id);
};

exports.getOne = function (req, res) {

	const getId = (id) => {
		if (id <= 0) {
			req.database.query("SELECT id_team FROM MembreEquipeWei WHERE id_member = ?;", [req.user.id], (error, result) => {
				if (error) {
					req.logger.error(error);
					res.sendStatus(500);
				} else {
					if (result.length > 0) {
						allMembers(result[0].id_team);
					}
				}
			});
		} else {
			allMembers(id);
		}
	};

	const allMembers = (id) => {
		req.database.query('SELECT id, nick, firstname, name FROM core_user AS u JOIN MembreEquipeWei AS me ON u.id = me.id_member WHERE me.id_team = ?;', [id], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				var members = [];
				for (let key in result) {
					members.push({
						id: result[key].id,
						nick: result[key].nick,
						firstname: result[key].firstname,
						name: result[key].name
					});
				}
				allTeam(id, {
					members: members
				});
			}
		});
	};

	const allTeam = (id, data) => {
		req.database.query('SELECT name, phrase, number, score FROM EquipeWei WHERE id=?;', [id], (error, result) => {
			if (error) {
				req.logger.error(error);
				req.sendStatus(500);
			} else {
				data.team = {
					id: id,
					name: result[0].name,
					phrase: result[0].phrase,
					number: result[0].number,
					score: result[0].score
				};
				allScore(id, data);
			}
		});
	};

	const allScore = (id, data) => {
		var score = [];
		req.database.query('SELECT event, bonus FROM ScoreEquipeWei WHERE team_id=?;', [id], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				for (let key in result) {
					score.push({
						event: result[key].event,
						score: result[key].bonus
					});
				}
				data.score = score;
				res.json(data);
			}
		});
	};
	getId(req.query.id);
};

exports.deleteTeam = function (req, res) {
	var id = req.body.id;
	req.database.query("DELETE FROM EquipeWei WHERE id = ?;", [id]);
	req.database.query("DELETE FROM MembreEquipeWei WHERE id_team = ?;", [id]);
	res.sendStatus(200);
};

const updateAllScores = (req, res) => {
	const getSum = (id) => {
		return new Promise((resolve, reject) => {
			req.database.query("SELECT SUM(bonus) AS s FROM ScoreEquipeWei WHERE team_id = ?;", [id], (error, result) => {
				if (error) {
					req.logger.error(error);
					reject();
				} else {
					req.database.query("UPDATE EquipeWei set score = ? WHERE id = ?;", [result[0].s, id], (errorScore, resultScore) => {
						if (errorScore) {
							req.logger.error(error);
							reject();
						} else {
							resolve();
						}
					});
				}
			});
		});
	};

	var promises = [];
	req.database.query("SELECT id FROM EquipeWei;", (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		}
		for (let key in result) {
			promises.push(getSum(result[key].id));
		}
	});

	Promise.all(promises).catch(function () {
		res.sendStatus(500);
	}).then(function () {
		res.sendStatus(200);
	});
};

exports.addScore = function (req, res) {
	var event = req.body.event;
	var team = req.body.team;
	var score = req.body.score;
	req.database.query("SELECT id FROM EquipeWei WHERE number = ?;", [team], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			updateScore(result[0].id);
		}
	});

	const updateScore = (idTeam) => {
		req.database.query("INSERT INTO ScoreEquipeWei (team_id, event, bonus) VALUES (?, ?, ?);", [idTeam, event, score], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				updateAllScores(req, res);
				res.sendStatus(200);
			}
		});
	};
};

exports.addMember = function (req, res) {
	var login = req.body.login;
	var number = req.body.team;

	const getMemberId = (login, number) => {
		req.database.query("SELECT id FROM core_user WHERE login=?;", [login], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else if (result.length <= 0) {
				res.json({
					message: "Membre introuvable"
				});
			} else {
				getTeamId(result[0].id, number);
			}
		});
	};

	const getTeamId = (idMember, number) => {
		req.database.query("SELECT id FROM EquipeWei WHERE number=?;", [number], (error, result) => {
			if (error) {
				req.logger.error(error);
				req.sendStatus(500);
			} else if (result.length <= 0) {
				res.json({
					message: "Equipe introuvable"
				});
			} else {
				allCheck(idMember, result[0].id);
			}
		});
	};

	const allCheck = (idMember, idTeam) => {
		req.database.query("SELECT COUNT(*) AS c FROM MembreEquipeWei WHERE id_member=?;", [idTeam, idMember], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				var count = result[0].c;
				if (count > 0) {
					res.json({
						message: "Le membre fait déjà partie d'une équipe"
					});
				} else {
					addRelation(idMember, idTeam);
				}
			}
		});
	};

	const addRelation = (idMember, idTeam) => {
		req.database.query("INSERT INTO MembreEquipeWei (id_member, id_team) VALUES (?, ?);", [idMember, idTeam], (error, result) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			}
			res.json({
				message: "C'est bon !"
			});
		});
	};
	getMemberId(login, number);
};

exports.deleteMember = function (req, res) {
	var id = req.body.id;
	req.database.query("DELETE FROM MembreEquipeWei WHERE id_member = ?;", [id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};