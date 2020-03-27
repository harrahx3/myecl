var fs = require('fs');

exports.getActiveMovies = function (req, res) {
	req.database.query('SELECT id, image, title, infos, date, synopsis FROM clubCine WHERE active = 1;', (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {
				movies: []
			};

			for (let i = 0; i < result.length; i++) {
				data.movies.push({
					id: result[i].id,
					image: result[i].image,
					title: result[i].title,
					infos: result[i].infos,
					date: result[i].date,
					synopsis: result[i].synopsis
				});
			}
			res.json(data);
		}
	});
};

exports.getInactiveMovies = function (req, res) {
	req.database.query('SELECT id, image, title, infos, date, synopsis FROM clubCine WHERE active = 0;', (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus();
		} else {
			var data = {
				movies: []
			};

			for (let i = 0; i < result.length; i++) {
				data.movies.push({
					id: result[i].id,
					image: result[i].image,
					title: result[i].title,
					infos: result[i].infos,
					date: result[i].date,
					synopsis: result[i].synopsis
				});
			}
			res.json(data);
		}
	});
};

exports.getMovie = function (req, res) {
	req.database.query("SELECT image, title, infos, date, synopsis FROM clubCine WHERE id = ?;", [req.query.id], (error, result) => {
		if (error) {
			req.log.error(error);
			res.sendStatus(500);
		} else {
			if (result.length) {
				res.json({
					image: result[0].image,
					title: result[0].title,
					infos: result[0].infos,
					date: result[0].date,
					synopsis: result[0].synopsis
				});
			} else {
				res.json({});
			}
		}
	});
};

exports.toggleMovie = function (req, res) {
	req.database.query("UPDATE clubCine SET active = 1 - active WHERE id = ?;", [req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.createMovie = function (req, res) {
	var filename = req.file.path.split('/');
	filename = filename[filename.length - 1];

	var extension = req.file.path.split('.');
	extension = extension[extension.length - 1];

	if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff', 'ico'].indexOf(extension.toLowerCase()) > -1) {
		req.database.query("INSERT INTO clubCine (image, title, infos, date, synopsis, active) VALUES (?, ?, ?, ?, ?, ?);", [filename, req.body.title, req.body.infos, req.body.date + ' ' + req.body.hour, req.body.synopsis, 1], (error, result) => {
			if (error) {
				req.logger.error(error);
			}
		});
	} else {
		req.logger.error('Unable to upload image: wrong file format');
		fs.unlink(req.user_upload + '/' + filename, (error) => {
			console.log(error);
		});
	}
	res.redirect("/user");
};

exports.updateMovie = function (req, res) {
	var filename = req.file.path.split('/');
	filename = filename[filename.length - 1];

	var extension = req.file.path.split('.');
	extension = extension[extension.length - 1];

	if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tif', 'tiff', 'ico'].indexOf(extension.toLowerCase()) > -1) {
		req.database.query("SELECT image FROM clubCine WHERE id = ?;", [req.body.id], (errorSelect, resultSelect) => {
			if (errorSelect) {
				req.logger.error(errorSelect);
			} else {
				if (resultSelect.length) {
					fs.unlink(req.user_upload + '/' + resultSelect[0].image, (errorUnlink) => {
						if (errorUnlink) {
							req.logger.error(errorUnlink);
						} else {
							req.database.query("UPDATE clubCine SET image = ?, title = ?, infos = ?, date = ?, synopsis = ? WHERE id = ?;", [filename, req.body.title, req.body.infos, req.body.date + ' ' + req.body.hour, req.body.synopsis, req.body.id], (error, result) => {
								if (error) {
									req.logger.error(error);
								}
							});
						}
					});
				}
			}
		});
	} else {
		req.logger.error('Unable to upload image: wrong file format');
		fs.unlink(req.user_upload + '/' + filename, (error) => {
			console.log(error);
		});
	}
	res.redirect("/user");
}

exports.deleteMovie = function (req, res) {
	req.database.query("SELECT image FROM clubCine WHERE id = ?;", [req.body.id], (errorImage, resultImage) => {
		if (errorImage) {
			req.logger.error(errorImage);
			res.sendStatus(500);
		} else {
			if (resultImage.length) {
				fs.unlink(req.user_upload + '/' + resultImage[0].image, (errorUnlink) => {
					if (errorUnlink) {
						req.logger.error(errorUnlink);
						res.sendStatus(500);
					} else {
						req.database.query("DELETE FROM clubCine WHERE id = ?;", [req.body.id], (error, result) => {
							if (error) {
								req.logger.error(error);
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