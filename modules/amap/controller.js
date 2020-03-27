var givePrice = (products, req) => {
	var price = 0;

	var promises = [];
	for (let i in products) {
		promises.push(new Promise((resolve, reject) => {
			req.database.query("SELECT price FROM ProduitAmap WHERE id = ?", [i], (error, data) => {
				if (error) {
					req.logger.error(err);
					reject();
				} else {
					price += products[i] * data[0]['price'];
					resolve(price);
				}
			});
		}));
	}
	return Promise.all(promises);
};

exports.addProduct = function (req, res) {
	req.database.query("INSERT INTO ProduitAmap (name, price) VALUES (?, ?);", [req.body.name, req.body.price], (error, data) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.removeProduct = function (req, res) {
	req.database.query("DELETE FROM ProduitAmap WHERE id = ?;", [req.body.id], (error, data) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};

exports.toggleWeek = function (req, res) {
	if (Object.prototype.hasOwnProperty.call(req.body, 'start') && Object.prototype.hasOwnProperty.call(req.body, 'end')) {
		req.database.query("INSERT INTO SemaineAmap (start, end) VALUES (?, ?);", [req.body.start, req.body.end], (error, data) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			}
		});
	} else {
		req.database.query("DELETE FROM SemaineAmap WHERE id = ?", [req.body.id], function (error, data) {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				res.sendStatus(200);
			}
		});
	}
};

exports.getCash = function (req, res) {
	req.database.query("SELECT * FROM SoldeAmap WHERE user_id = ?", [req.query.id], function (error, data) {
		if (error) {
			req.logger.error(error);
		} else {
			res.json({
				'cash': data.length ? data[0]['amount'] : 0
			});
		}
	});
};

exports.updateCash = function (req, res) {
	if (!isNaN(parseInt(req.body.amount))) {
		req.database.query('SELECT COUNT(*) AS c FROM SoldeAmap WHERE user_id = ?;', [req.body.id], (error, data) => {
			if (error) {
				req.logger.error(error);
				res.sendStatus(500);
			} else {
				if (data[0].c > 0) {
					req.database.query('UPDATE SoldeAmap SET amount = ? WHERE user_id = ?;', [req.body.amount, req.body.id], (errorSub, data) => {
						if (errorSub) {
							req.logger.error(errorSub);
							res.sendStatus(500);
						} else {
							res.sendStatus(200);
						}
					});
				} else {
					req.database.query('INSERT INTO SoldeAmap (user_id, amount) VALUES (?, ?);', [req.body.id, req.body.amount], (errorSub, data) => {
						if (errorSub) {
							req.logger.error(errorSub);
							res.sendStatus(500);
						} else {
							res.sendStatus(200);
						}
					});
				}
			}
		});
	} else {
		res.sendStatus(500);
	}
};

exports.getAllOrders = function (req, res) {
	var week = req.query.week;
	req.database.query("SELECT u.name AS name, u.firstname AS firstname, ca.products AS products FROM CommandeAmap AS ca JOIN core_user AS u ON u.id = ca.user_id WHERE week = ?;", [week], (error, data) => {
		if (error) {
			req.log.error(error);
			res.sendStatus(500);
		} else {
			var orders = [];

			var promises = [];
			for (let order in data) {
				promises.push(new Promise((resolve, reject) => {
					var obj = {
						'firstname': data[order]['firstname'],
						'name': data[order]['name'],
						'products': JSON.parse(data[order]['products']),
						'price': 0
					};
					givePrice(obj.products, req).then((result) => {
						if (result.length) {
							obj.price = Math.max(...result);
						}
						orders.push(obj);
						resolve();
					});
				}));
				// object.descr ?
			}
			Promise.all(promises).then(function () {
				res.send(orders);
			});
		}
	});
};

exports.searchUser = function (req, res) {
	req.services.user.search(req.query.name, (promises, results) => {
		Promise.all(promises).then(() => {
			res.send(JSON.stringify(results));
		})
	});
};

exports.getAccount = function (req, res) {
	var id = req.user.id;
	var week = req.query.week;
	var result = {
		'cash': 0,
		'products': {}
	};

	// PRODUCTS
	var pProducts = new Promise((resolveProduct, rejectProduct) => {
		req.database.query("SELECT * FROM ProduitAmap", (errorProduct, dataProduct) => {
			if (errorProduct) {
				req.logger.error(errorProduct);
				rejectProduct();
			} else {
				var promises_d = [];
				for (let i in dataProduct) {
					promises_d.push(new Promise(function (resolve_d) {
						result.products[dataProduct[i].id] = {
							id: dataProduct[i].id,
							name: dataProduct[i].name,
							price: dataProduct[i].price,
							quantity: "0"
						};
						resolve_d();
					}));
				}
				Promise.all(promises_d).then(function () {
					resolveProduct();
				});
			}
		});
	});

	pProducts.then(function () {
		var pOrder = new Promise((resolveOrder, rejectOrder) => {
			req.database.query("SELECT * FROM CommandeAmap WHERE user_id = ? AND week = ?", [id, week], (errorOrder, dataOrder) => {
				if (errorOrder) {
					req.logger.error(errorOrder);
					rejectOrder();
				} else {
					if (dataOrder.length) {
						var products = JSON.parse(dataOrder[0]['products']);
						var promises_d = [];
						for (let i in products) {
							promises_d.push(new Promise(function (resolve_d) {
								result.products[i].quantity = products[i];
								resolve_d();
							}));
						}
						Promise.all(promises_d).then(function () {
							resolveOrder();
						});
					} else {
						resolveOrder();
					}
				}
			});
		});

		pOrder.then(function () {
			pCash = new Promise((resolveCash, rejectCash) => {
				req.database.query("SELECT amount FROM SoldeAmap WHERE user_id = ?", [id], (errorCash, dataCash) => {
					if (errorCash) {
						req.logger.error(errorCash);
						rejectCash();
					} else {
						if (dataCash.length) {
							result.cash = dataCash[0]['amount'];
						}
						resolveCash();
					}
				});
			});

			pCash.then(function () {
				res.json(result);
			})
		});
	});
};

exports.getProducts = function (req, res) {
	req.database.query('SELECT * FROM ProduitAmap', (error, data) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var products = [];
			for (let i in data) {
				products.push({
					'name': data[i]['name'],
					'price': data[i]['price'],
					'id': data[i]['id']
				});
			}
			res.send(products);
		}
	});
};

exports.getWeeks = function (req, res) {
	req.database.query("SELECT id, DATE_FORMAT(start, GET_FORMAT(DATE, 'EUR')) AS start, DATE_FORMAT(end, GET_FORMAT(DATE, 'EUR')) AS end FROM SemaineAmap", (error, data) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			var weeks = [];
			for (let i in data) {
				weeks.push({
					'start': data[i]['start'],
					'end': data[i]['end'],
					'id': data[i]['id']
				});
			}
			res.send(weeks);
		}
	});
};

exports.computePrice = function (req, res) {
	var products = JSON.parse(req.query.products);
	givePrice(products, req).then((result) => {
		var price = 0;
		if (result.length) {
			price = Math.max(...result);
		}
		res.json({
			price: price
		});
	});
};

exports.updateOrder = function (req, res) {
	var date = new Date();
	if (date.getDay() < 5 || (date.getDay() == 5 && date.getHours() <= 17)) {
		var user_id = req.user.id;
		var week = req.body.week;
		var new_products = JSON.parse(req.body.products);

		var id = 0;
		var old_products = {};
		var old_price = 0;
		var new_price = 0;
		var cash = 0;

		var old = new Promise((resolve, reject) => {
			req.database.query("SELECT * FROM CommandeAmap WHERE user_id = ? AND week = ?", [user_id, week], (error, data) => {
				if (error) {
					req.logger.error(error);
					reject();
				} else {
					if (data.length) {
						id = data[0]['id']
						old_products = JSON.parse(data[0]['products']);
					}
					resolve();
				}
			});
		});

		old.then(function () {
			givePrice(old_products, req).then((result) => {
				if (result.length) {
					old_price = Math.max(...result);
				}
			});

			givePrice(new_products, req).then((result) => {
				if (result.length) {
					new_price = Math.max(...result);
				}
			});

			var possible = new Promise((resolve, reject) => {
				req.database.query("SELECT amount FROM SoldeAmap WHERE user_id = ?", [user_id], (error, data) => {
					if (error) {
						req.log.error(error);
						reject();
					} else {
						if (data.length) {
							cash = data[0]['amount'];
						}
						resolve();
					}
				});
			});

			possible.then(function () {
				if (cash + old_price < new_price) {
					res.send(false);
				} else {
					var promises = [];
					promises.push(new Promise((resolve, reject) => {
						if (id > 0) {
							req.database.query("UPDATE CommandeAmap SET products = ? WHERE week = ? AND user_id = ? AND id = ?;", [JSON.stringify(new_products), week, user_id, id], (error, result) => {
								if (error) {
									req.logger.error(error);
									reject();
								} else {
									resolve();
								}
							});
						} else {
							req.database.query("INSERT INTO CommandeAmap (user_id, week, products) VALUES (?, ?, ?);", [user_id, week, JSON.stringify(new_products)], (error, result) => {
								if (error) {
									req.logger.error(error);
									reject();
								} else {
									resolve();
								}
							});
						}
					}));

					promises.push(new Promise((resolve, reject) => {
						req.database.query("UPDATE SoldeAmap SET amount = ? WHERE user_id = ?", [cash + old_price - new_price, user_id], (error, data) => {
							if (error) {
								req.logger.error(error);
								reject();
							} else {
								resolve();
							}
						});
					}));

					Promise.all(promises).then(function () {
						res.send(true);
					});
				}
			})
		});
	} else {
		res.sendStatus(500);
	}
};

exports.removeOrder = function (req, res) {
	req.database.query('DELETE FROM CommandeAmap WHERE user_id = ? AND week = ?', [req.body.id, req.body.week], (error, data) => {
		if (error) {
			req.logger.error(error);
			res.sendStatus(500);
		} else {
			res.sendStatus(200);
		}
	});
};