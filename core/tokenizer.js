/* jshint esversion:6 */

/*
	Two middlewares to create and check tokens for csrf security
	One function to clean expired tokens
*/

const crypto = require('crypto');

module.exports = (context) => {
	context.logger.title('Tokenizer');
	var tokenizer = {};

	tokenizer.new = (req, res, next) => {
		crypto.randomBytes(192, function (errorGenerate, buffer) {
			if (errorGenerate) {
				context.logger.error('Unable to generate token');
				res.sendStatus(500);
			} else {
				const token = buffer.toString('base64');
				context.database.query('INSERT INTO core_token (token, login, time) VALUES (?, ?, now());', [token, req.session.user.login], (errorInsert) => {
					if (errorInsert) {
						console.log(errorInsert);
						context.logger.error('Unable to insert token into database');
						res.sendStatus(500);
					} else {
						req.token = token;
						next();
					}
				});
			}
		});
	};

	tokenizer.check = (req, res, next) => {
		context.database.query('SELECT COUNT(*) AS c FROM core_token WHERE login = ? AND token = ? AND TIMESTAMPDIFF(SECOND, NOW(), ADDTIME(time, ?)) < 0', [login, req.token, 1000 * context.tokenLife], (errorInsert, result) => {
			if (errorInsert) {
				context.logger.error('Unable to select token from database');
				next();
			} else {
				context.database.query('DELETE FROM core_token WHERE login = ? and token = ? and TIMESTAMPDIFF(SECOND, NOW(), ADDTIME(time, ?)) < 0', [login, req.token, 1000 * context.tokenLife], (errorDelete) => {
					if (errorDelete) {
						context.logger.error('Unable to remove token from database');
					}
					if (result[0].c > 0) {
						next();
					}
				});
			}
		});
	};

	tokenizer.clean = () => {
		context.database.query('DELETE FROM core_token WHERE TIMESTAMPDIFF(SECOND, NOW(), ADDTIME(time, ?)) > 0', [1000 * context.tokenLife], (error, result) => {
			if (error) {
				context.logger.warning('Unable to clean old tokens');
			}
		});
	};

	context.tokenizer = tokenizer;
	context.logger.done();
};