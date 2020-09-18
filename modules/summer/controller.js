exports.getOne = function (req, res) {
	req.database.query('SELECT * FROM BDENewsletter WHERE id = ?;', [req.query.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			if (result.length > 0) {
				res.json({
					id: result[0]['id'],
					content: result[0]['content'],
					date: result[0]['date']
				});
			} else {
				res.json({
					id: "-1",
					content: "La newsletter n'a pas pu être trouvée",
					date: "21/04/1998"
				});
			}
		}
	});
};

exports.getAll = function (req, res) {
	req.database.query('SELECT * FROM BDENewsletter ORDER BY date DESC;', (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var data = {
				newsletters: []
			};
			if (result.length > 0) {
				for (let i in result) {
					data.newsletters.push({
						id: result[i]['id'],
						date: result[i]['date'],
						content: result[i]['content']
					});
				}
			}
			res.json(data);
		}
	});
};

exports.add = function (req, res) {
	req.database.query('INSERT INTO BDENewsletter (content, date) VALUES (?, NOW());', [req.body.content], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.update = function (req, res) {
	req.database.query('UPDATE BDENewsletter SET content = ? WHERE id = ?;', [req.body.content, req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.delete = function (req, res) {
	req.database.query('DELETE FROM BDENewsletter WHERE id = ?;', [req.body.id], (error, result) => {
		if (error) {
			req.logger.error(error);
		} else {
			res.sendStatus(200);
		}
	});
};
