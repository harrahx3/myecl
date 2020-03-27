/* jshint esversion:6 */

/*
    Some basic functions to encrypt and compare passwords
*/

const bcrypt = require('bcrypt');

module.exports = (context) => {
	context.logger.title('Crypter');
	var crypter = {};

	// callback = (encrypted) => {}
	crypter.encrypt = (password, callback) => {
		bcrypt.hash(password, 10, (errorEncrypt, encrypted) => {
			if (errorEncrypt) {
				context.log.error('Impossible to encrypt password');
				context.logger.error(errorEncrypt);
				callback(null);
			} else {
				callback(encrypted);
			}
		});
	};

	// callback = (equal) => {}
	crypter.compare = (clear, encrypted, callback) => {
		bcrypt.compare(clear, encrypted, (errorCompare, matched) => {
			if (errorCompare) {
				context.log.error('Impossible to compare passwords');
				context.logger.error(errorCompare);
				callback(false);
			} else {
				callback(matched);
			}
		});
	};

	context.crypter = crypter;
	context.logger.done();
};