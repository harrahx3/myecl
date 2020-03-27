/* jshint esversion: 6*/

/*
    Sets routes involved in signing in and out
*/
const jwt = require('jsonwebtoken');

module.exports = (context) => {
	var controller = {};

	controller.load = (req, res) => {
		res.sendFile('/signin/index.html', {
			root: context.publicPath
		});
	};

	controller.signin = (req, res, next) => {
		context.database.query('SELECT id, password FROM core_user WHERE login = ?', [req.body.login], (error, result) => {
			if (error) {
				context.logger.error('Unable to select user into database');
				res.redirect('/signin');
			} else {
				if (result.length) {
					context.crypter.compare(req.body.password, result[0].password, (valid) => {
						if (valid) {
							jwt.sign({
								id: result[0].id,
								login: req.body.login,
								route: '',
								location: '',
								moduleName: ''
							}, context.jwt, {
								expiresIn: '1h'
							}, (errorJwt, token) => {
								if (errorJwt) {
									context.logger.error('Unable to get jwt');
									res.sendStatus(500);
								} else {
									context.database.query('UPDATE core_user SET online = 1 WHERE login=?', [req.body.login], (errorOnline, resultOnline) => {
										if (errorOnline) {
											context.logger.warning('Unable to set user online');
										}
										res.cookie('jwt', token, {
											maxAge: context.sessionLife * 1000
										});
										res.redirect('/user');
									});
								}
							});
						} else {
							res.redirect('/signin?invalid=1');
						}
					});
				} else {
					res.redirect('/signin?invalid=0');
				}
			}
		});
	};

	controller.signout = (req, res) => {
		context.database.query('UPDATE core_user SET online = 0, last_seen = NOW() WHERE id = ?;', [req.user.id], (error, result) => {
			if (error) {
				context.logger.warning('Unable to set offline on database');
			}
			res.clearCookie('jwt');
			res.redirect('/');
		});
	};

	return controller;
};