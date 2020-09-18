exports.getAllAdmin = function (req, res) {
	var xss = require("xss");
	var data = {};
	data.studies = [];

	var promises = [];
	req.database.query('SELECT * FROM je_studies', function (error, result) {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			if (result.length > 0) {
				for (let key in result) {
					promises.push(new Promise((resolve, reject) => {
						var study = {};
						study.id = result[key]['id'];
						study.description = xss(result[key]['description']);
						study.title = xss(result[key]['title']);
						study.ids = JSON.parse(result[key]['appliants']).ids;
						study.students = [];

						var spromises = [];
						for (let id in study.ids) {
							spromises.push(new Promise((sresolve, sreject) => {
								req.database.query("SELECT firstname, name, nick FROM core_user WHERE id = ?", [study.ids[id]], (serror, sresult) => {
									if (serror) {
										req.logger.error("Erreur lors de la requête");
										res.sendStatus(500);
									} else {
										var student = {};
										student.name = sresult[0]['name'];
										student.firstname = sresult[0]['firstname'];
										student.nick = sresult[0]['nick'];
										study.students.push(student);
									}
									sresolve();
								});
							}));
						}
						Promise.all(spromises).then(function () {
							data.studies.push(study);
							resolve();
						});
					}));
				}

				Promise.all(promises).then(function () {
					res.json(data);
				});
			} else {
				res.json({});
			}
		}
	});
}

exports.getAll = function (req, res) {
	var xss = require("xss");
	req.database.query('SELECT * FROM je_studies ;', function (error, result) {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {};
			data.studies = [];

			for (let key in result) {
				let study = {};
				study.id = result[key]['id'];
				study.description = xss(result[key]['description']);
				study.title = xss(result[key]['title']);
				study.appliantsNumber = JSON.parse(result[key]["appliants"]).ids.length;
				study.isIn = JSON.parse(result[key]['appliants']).ids.includes(req.user.id);
				data.studies.push(study);
			}
			res.json(data);
		}
	});
};

exports.add = function (req, res) {
	req.database.query("INSERT INTO je_studies (title, description, appliants) VALUES (?, ?, ?);", [req.body.title, req.body.description, req.body.appliants], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.delete = function (req, res) {
	req.database.query("DELETE FROM je_studies WHERE id = ?;", [req.body.id], function (error, result) {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.update = function (req, res) {
	req.database.query("UPDATE je_studies SET title = ?, description = ? WHERE id = ?;", [req.body.title, req.body.description, req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.apply = function (req, res) {
	req.database.query('SELECT appliants FROM je_studies WHERE id = ?;', [req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var appliants = {};
			var json = JSON.parse(result[0]["appliants"]);
			appliants.ids = json.ids;
			if (!json.ids.includes(req.user.id)) {
				appliants.ids.push(req.user.id);
				var data = JSON.stringify(appliants);
				req.database.query("UPDATE je_studies SET appliants = ? WHERE id = ?;", [data, req.body.id], (errorApply, resultApply) => {
					if (errorApply) {
						req.logger.error(errorApply);
						res.sendStatus(500);
					} else {
						res.sendStatus(200);
					}
				});
			}
		}
	})
}

exports.quit = function (req, res) {
	req.database.query('SELECT appliants FROM je_studies WHERE id=?;', [req.body.id], function (error, result) {
		if (error) {
			req.logger.error("Erreur lors de la requête");
			res.sendStatus(500);
		} else {
			var appliants = {};
			var json = JSON.parse(result[0]["appliants"]);
			appliants.ids = json.ids;
			if (json.ids.includes(req.user.id)) {
				var pos = appliants.ids.indexOf(req.user.id);
				appliants.ids.splice(pos, 1);
				var data = JSON.stringify(appliants);
				req.database.query("UPDATE je_studies SET appliants = ? WHERE id = ?;", [data, req.body.id], (errorQuit, resultQuit) => {
					if (errorQuit) {
						req.logger.error(errorQuit);
						res.sendStatus(500);
					} else {
						res.sendStatus(200);
					}
				});
			}
		}
	})
};
