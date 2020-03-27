const fs = require('fs');

exports.getUserOrders = function (req, res) {
	req.database.query('SELECT * FROM CommandeSdec JOIN core_user AS u ON CommandeSdec.user_id = u.id WHERE u.id = ?;', [req.user.id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.json({});
		} else {
			var data = {};
			data.list = [];
			for (let key in result) {
				data.list.push({
					'id': result[key]['order_id'],
					'format': result[key]['format'],
					'quantity': result[key]['quantity'],
					'pages': result[key]['pages'],
					'color': result[key]['color'] == 1,
					'recto_verso': result[key]['recto_verso'] == 1,
					'price': result[key]['price'],
					'file_path': result[key]['file_path'],
					'comment': result[key]['comment'],
					'state': result[key]['state']
				});
			}
			res.json(data);
		}
	});

};

exports.getAllOrders = function (req, res) {
	req.database.query('SELECT * FROM CommandeSdec JOIN core_user AS u ON CommandeSdec.user_id = u.id;', (error, result) => {
		if (error) {
			req.logger.error('Erreur lors de la requête');
			res.json({});
		} else {
			var data = {
				'new': [],
				'pending': [],
				'waiting': [],
				'other': []
			};
			var indexToArray = {
				'0': 'new',
				'1': 'pending',
				'2': 'waiting',
				'_': 'other'
			};

			for (let key in result) {
				let order = {
					'id': result[key]['order_id'],
					'format': result[key]['format'],
					'quantity': result[key]['quantity'],
					'pages': result[key]['pages'],
					'color': result[key]['color'] == 1,
					'recto_verso': result[key]['recto_verso'] == 1,
					'price': result[key]['price'],
					'file_path': result[key]['file_path'],
					'comment': result[key]['comment'],
					'name': result[key]['name'],
					'firstname': result[key]['firstname'],
					'nick': result[key]['nick'],
					'email': result[key]['email']
				};
				data[indexToArray[indexToArray.hasOwnProperty(result[key]['state']) ? result[key]['state'] : '_']].push(order);
			}
			res.json(data);
		}
	});
};

exports.newOrder = function (req, res) {

	var filePath = req.file.path.split('/');
	filePath = filePath[filePath.length - 1];

	var extension = filePath.split('.');
	extension = extension[extension.length - 1];

	function removeFile(filePath) {
		fs.unlink(req.user_upload + '/' + filePath, (error) => {
			console.log(error);
		});
	}

	if (!isNaN(parseInt(req.body.quantity)) && parseInt(req.body.quantity) >= 1 &&
		!isNaN(parseInt(req.body.pages)) && parseInt(req.body.pages) >= 1 && ["A0", "A1", "A2", "A3", "A4", "A5"].includes(req.body.format) &&
		!isNaN(parseFloat(req.body.price)) && parseFloat(req.body.price) > 0 &&
		req.body.comment.constructor == String) {

		req.body.color = req.body.color ? '1' : '0';
		req.body.rectoVerso = req.body.rectoVerso ? '1' : '0';

		if (['jar', 'exe', 'sh', 'java', 'binary'].indexOf(extension) == -1) {
			var data = [req.body.quantity, req.body.pages, req.body.format, req.body.color, req.body.rectoVerso, req.body.price, filePath, req.body.comment, req.user.id, 0];
			req.database.query("INSERT INTO CommandeSdec (quantity, pages, format, color, recto_verso, price, file_path, comment, user_id, state) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);", data, (error, result) => {
				if (error) {
					req.logger.warning(error);
					removeFile(filePath);
				}
				res.redirect('/user');
			});
		} else {
			req.logger.warning('Incorrect format');
			removeFile(filePath);
			res.redirect('/user');
		}
	} else {
		req.logger.warning('Incorrect format');
		removeFile(filePath);
		res.redirect('/user');
	}
};

exports.updateOrder = function (req, res) {
	var data = [];
	var reqComplement = "";
	for (let i in req.body) {
		if (['quantity', 'pages', 'format', 'color', 'recto_verso', 'price', 'comment', 'state'].includes(i)) {
			reqComplement += i + " = ? ";
			data.push(req.body[i]);
		}
	}
	data.push(req.body.order_id);

	req.database.query("UPDATE CommandeSdec SET " + reqComplement + " WHERE order_id = ?", data, function (error, result) {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.deleteOrder = function (req, res) {
	var id = parseInt(req.body.order_id);
	var file_path = "";
	req.database.query("SELECT file_path FROM CommandeSdec WHERE order_id = ?;", [id], (error, result) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else if (result.length > 0) {
			file_path = result[0]['file_path'];
			fs.unlink(req.user_upload + '/' + file_path, function (err) {
				if (err) {
					req.logger.error(err);
					res.sendStatus(500);
				} else {
					req.database.query("DELETE FROM CommandeSdec WHERE order_id = ?;", [id], (errorDel, resultDel) => {
						if (errorDel) {
							req.logger.error(errorDel);
							res.sendStatus(500);
						} else {
							res.sendStatus(200);
						}
					});
				}
			});
		}
	});
};